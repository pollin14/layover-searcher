'use strict';

const gulp      = require('gulp');
const _         = require('lodash');
const gutils    = require('gulp-util');
const del       = require('del');
const concat    = require('gulp-concat');
const uglify    = require('gulp-uglify');
const cache     = require('gulp-cache');
const download  = require('gulp-download-stream');
const gulpIf    = require('gulp-if');
const jshint    = require('gulp-jshint');
const bower     = require('gulp-bower');
const wrapper   = require('gulp-wrapper');
const csvToJson = require('gulp-csvtojson');
const insert    = require('gulp-insert');
const extReplace = require('gulp-ext-replace');
const htmlReplace = require('gulp-html-replace');
const inquirer  = require('inquirer');
const s3        = require('knox');
const argv      = require('yargs').argv;
const pack      = require('./package.json');

/**************************************
 * Parameters
 **************************************/
const gulpParameters = require('./parameters/gulp-parameters.json');
const parameters = require( argv.prod? './parameters/parameters.prod.json': './parameters/parameters.dev.json');


/**************************************
 * Main Task
 *************************************/

gulp.task('build', ['clean', 'html-replace', 'compile', 'copy-css']);
gulp.task('publish', ['upload']);
gulp.task('default', ['build']);

/**************************************
 * Secondary and Auxiliary Task
 *************************************/

/**
 * Watch
 */
gulp.task('watch', ['build'], function () {
    gulp.watch(['src/**/*.js', 'parameters/*.dev.json']);
});

gulp.task('bower', function () {
    return bower();
});

gulp.task('jshint',  function () {
    gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'))
    ;
});

gulp.task('clean', function () {
    return del([pack.gulpConfig.tmpDir, pack.gulpConfig.buildDir]);
});

/**
 * Converts the layover information from csv to javascript.
 */
gulp.task('csv-to-js', ['clean'], function () {
    return gulp.src(pack.gulpConfig.resourceDir + '/layover.csv')
        .pipe(csvToJson({ toArrayString: true }))
        .pipe(insert.prepend('var layoverSearcherDatabase = '))
        .pipe(insert.append(';'))
        .pipe(extReplace('.js'))
        .pipe(gulp.dest(pack.gulpConfig.tmpDir));
});

/**
 * Replaces the script and stylesheets path with the prod or dev paths.
 */
gulp.task('html-replace', ['clean'], function () {
    return gulp.src('src/views/index.html')
        .pipe(htmlReplace(parameters.assets.paths))
        .pipe(gulp.dest(pack.gulpConfig.buildDir))
    ;
});

gulp.task('compile', ['clean', 'jshint', 'csv-to-js'], function () {
    return gulp.src([
        pack.gulpConfig.tmpDir + '/layover.js',
        'src/scripts/**/*.js'
    ])
        .pipe(concat('layoverSearcher.js'))
        .pipe(wrapper({
            header: '// Version: ' + pack.version + '\n(function () {\n\'use strict\';\n',
            footer: '})();'
        }))
        .pipe(gulpIf(argv.prod, uglify()))
        .pipe(gulp.dest(pack.gulpConfig.buildDir));
});

gulp.task('copy-css', ['clean'], function () {
    return gulp.src('src/styles/*')
        .pipe(gulp.dest(pack.gulpConfig.buildDir));
});

gulp.task('upload', ['build'], function () {
    const filesNames = ['layoverSearcher.js', 'index.html', 'layoverSearcher.css'];
    const aws = {
        key: gulpParameters.awsS3Key,
        secret: gulpParameters.awsS3secret,
        bucket: gulpParameters.awsS3Bucket
    };
    var originDir = './' + pack.gulpConfig.buildDir;
    var destinationDir = pack.gulpConfig.awsS3JsLibrariesDir +'/' + pack.name;

    filesNames.forEach(function (fileName) {
        s3.createClient(aws)
            .putFile(originDir + '/' + fileName, destinationDir + '/' + fileName, function (e, a) {
                if (e !== null) {
                    console.log(e);
                }
                gutils.log('Url \'' + a.req.url + '\'');
                a.resume();
            });
    });
});
