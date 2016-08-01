'use strict';

const params = require('./parameters/gulp-parameters.json');
const csvPathname = './resources/layover.csv';

const aws = {
    key: params.awsS3Key,
    secret: params.awsS3secret,
    bucket: params.awsS3Bucket
};

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
    return del(['tmp', 'build']);
});

gulp.task('csv-to-js', function () {
    return gulp.src(csvPathname)
        .pipe(csvToJson({ toArrayString: true }))
        .pipe(insert.prepend('var layoverSearcherDatabase = '))
        .pipe(insert.append(';'))
        .pipe(extReplace('.js'))
        .pipe(gulp.dest('tmp'));
});

gulp.task('build', ['clean', 'csv-to-js', 'compile'], function () {
    return gulp.src([
        'tmp/layover.js',
        'tmp/layoverSearcher.js'
    ])
        .pipe(concat('layoverSearcher.js'))
        .pipe(gulp.dest('build'))
        ;
});

gulp.task('html-replace', function () {
    return gulp.src('src/views/index.html')
        .pipe(htmlReplace({
            vendor_js: [
                'https://code.jquery.com/jquery-3.1.0.min.js',
                'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js'
            ],
            vendor_css: [
                'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'
            ],
            main_js: [
                'https://s3.amazonaws.com/static-s3.clickbus.com.mx/js-libraries/layover-searcher/layoverSearcher.js'
            ],
            main_cc: [
                'https://s3.amazonaws.com/static-s3.clickbus.com.mx/js-libraries/layover-searcher/layoverSearcher.css'
            ]
        }))
        .pipe(gulp.dest('build'))
    ;
});

gulp.task('compile', ['jshint'], function () {

    return gulp.src([
        'src/widget/**/*.js'
    ])
        .pipe(
            concat('layoverSearcher.js')
        )
        .pipe(wrapper({
            header: '// Version: ' + pack.version + '\n(function () {\n\'use strict\';\n',
            footer: '})();'
        }))
        .pipe(gulpIf(argv.prod, uglify()))
        .pipe(gulp.dest('tmp'));
});

gulp.task('upload', ['build'], function () {
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