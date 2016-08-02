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

/****************************
 * Parameters
 ***************************/
const csvPathname = './resources/layover.csv';
const gulpParameters = require('./parameters/gulp-parameters.json');
const parameters = require( argv.prod? './parameters/parameters.prod.json': './parameters/parameters.dev.json');

/**
 * Watch
 */
gulp.task('watch', ['publish'], function () {
    gulp.watch(['src/**/*.js']);
});

gulp.task('bower', function () {
    return bower();
});

gulp.task('jshint', function () {
    gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'))
    ;
});

gulp.task('clean', function () {
    del(['tmp', 'build']);
});

/**
 * Converts the layover information from csv to javascript.
 */
gulp.task('csv-to-js', function () {
    return gulp.src(csvPathname)
        .pipe(csvToJson({ toArrayString: true }))
        .pipe(insert.prepend('var layoverSearcherDatabase = '))
        .pipe(insert.append(';'))
        .pipe(extReplace('.js'))
        .pipe(gulp.dest('tmp'));
});

gulp.task('build', ['clean', 'html-replace', 'compile'], function () {

});

/**
 * Replaces the script and stylesheets path with the prod or dev paths.
 */
gulp.task('html-replace', function () {
    return gulp.src('src/views/index.html')
        .pipe(htmlReplace(parameters.assets.paths))
        .pipe(gulp.dest('build'))
    ;
});

gulp.task('compile', ['jshint', 'csv-to-js'], function () {
    return gulp.src([
        'tmp/layover.js',
        'src/scripts/**/*.js'
    ])
        .pipe(concat('layoverSearcher.js'))
        .pipe(wrapper({
            header: '// Version: ' + pack.version + '\n(function () {\n\'use strict\';\n',
            footer: '})();'
        }))
        .pipe(gulpIf(argv.prod, uglify()))
        .pipe(gulp.dest('build'));
});

gulp.task('upload', ['build'], function () {
    // const aws = {
    //     key: gulpParameters.awsS3Key,
    //     secret: gulpParameters.awsS3secret,
    //     bucket: gulpParameters.awsS3Bucket
    // };
    // var name = getMainFilePathname(argv.prod);
    // var origin = './' + pack.buildDir + '/' + name;
    // var destination = pack.awsS3JsLibrariesDir +'/' + pack.name + '/' + name;
    //
    // s3.createClient(aws)
    //     .putFile(origin, destination, function (e, a) {
    //         if (e !== null) {
    //             console.log(e);
    //         }
    //         gutils.log('Url \'' + a.req.url + '\'');
    //         a.resume();
    //     });
});

gulp.task('default', ['build']);