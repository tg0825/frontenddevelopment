const pkg = require('./package.json');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

gulp.task('jslint', function () {
    return gulp.src(['src/**/*.js'])
        .pipe($.jslint())
});

gulp.task('jsdoc3', function (cb) {
    var config = require('./jsdocConfig.json');
    gulp.src(['README.md', './src/**/*.js'], {read: false})
        .pipe($.jsdoc3(config, cb));
});

gulp.task('concat', function () {
    return gulp.src([
        'src/namespace.js',
        'src/organizationTree.js',
        'src/naver.*.js'
    ])
    .pipe($.concat(pkg.name + '-' + pkg.version + '.js'))
    .pipe(gulp.dest('./build/'));
})

gulp.task('default', ['jslint', 'jsdoc3', 'concat']);
