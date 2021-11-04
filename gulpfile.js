
let preprocessor = 'sass';

const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const bssi = require('browsersync-ssi');
const ssi = require('gulp-ssi');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass');
const less = require('gulp-less');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const webp = require("imagemin-webp");
const extReplace = require("gulp-ext-replace");
const newer = require('gulp-newer');
const del = require('del');


function browsersync(){
	browserSync.init({ 
		server: { 
			baseDir: 'app/',
			middleware: bssi({baseDir: 'app/', ext: '.html'})
		 },
		tunnel: 'localhost',
		port: 8082, 
		notify: false, 
		online: true, 
	})
}

function html(){
  	return src( ['app/html/*.html', '!app/{footer, header}.html'] )
  	.pipe(ssi({ root: 'app/' }))
  	.pipe(dest('app/'))
}


function scripts() {
	return src([ 
		'node_modules/jquery/dist/jquery.min.js', 
		'app/js/*.js', 
		'!app/js/main.min.js'
		])
	.pipe(babel({presets: ['@babel/preset-env']}))
	.pipe(concat('main.min.js')) 
	.pipe(uglify()) 
	.pipe(dest('app/js/')) 
	.pipe(browserSync.stream()) 
}

function styles() {
	return src([
	'app/' + preprocessor + '/*.' + preprocessor + '', 
	"app/css/*.css", 
	'!app/css/main.min.css'
	]) 
	.pipe(eval(preprocessor)()) 
	.pipe(concat('main.min.css')) 
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) 
	.pipe(cleancss( { level: { 1: { specialComments: 0 } } } )) 
	.pipe(dest('app/css/')) 
	.pipe(browserSync.stream()) 
}

function startwatch() {
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
	watch(['app/**/' + preprocessor + '/**/*', 'app/css/*.css', '!app/css/main.min.css'], styles, browserSync.reload);
	watch(['app/{footer,header}.html', 'app/html/*.html']).on('change', html);
	watch(['app/*.html', 'app/**/' + preprocessor + '/**/*']).on('change', browserSync.reload);
	watch('app/images/src/**/*', images);
 
}

function images() {
  return src('app/images/src/**/*')
    .pipe(newer('app/images/dest/'))
    .pipe(imagemin())
    .pipe(dest('app/images/dest/'));
}

function cleanimg() {
	return del('app/images/dest/**/*', { force: true }) 
}

function buildcopy() {
	return src([ 
		'app/css/*.min.css',
		'app/js/*.min.js',
		'app/images/src/**/*',
		'app/libs/icons/**/*',
		'app/*.html',
		'!app/{footer, header}.html',
		], { base: 'app' }) 
	.pipe(dest('dist')) 
}

function cleandist() {
	return del('dist/**/*', { force: true }) 
}


exports.browsersync = browsersync;
exports.html = html;
exports.scripts = scripts;
exports.styles = styles;
exports.images = images;
exports.cleanimg = cleanimg;
exports.default = series(styles, scripts, html, images,  parallel(browsersync, startwatch));
exports.build = series(cleandist, styles, scripts, images,  html, buildcopy);