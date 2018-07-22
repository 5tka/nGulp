const
  gulp = require('gulp'),
  concat = require('gulp-concat'), // Склейка файлов
  browserSync = require('browser-sync'), // BrowserSync
  pug = require('gulp-pug'), // Pug обработчик html
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  cssnano = require('gulp-cssnano'), //Минификация CSS
  autoprefixer = require('gulp-autoprefixer'), // Автопрефиксы CSS
  imagemin = require('gulp-imagemin'), // Сжатие JPG, PNG, SVG, GIF
  uglify = require('gulp-uglify'), // Минификация JS
  plumber = require('gulp-plumber'),
  shorthand = require('gulp-shorthand'), // шорт код
  rename = require('gulp-rename'),
  watch = require('gulp-watch'),
  rigger = require('gulp-rigger'), // іморт файлів в файл like //="../../../bower_components/...
  gcmq = require('gulp-group-css-media-queries'), // обєднує media з однаковими breakpoint
  criticalCss = require('gulp-critical-css'),
  print = require('gulp-print').default,
  clean = require('gulp-clean'),
  path = require('path'),
  cache = require('gulp-cached'),
  remember = require('gulp-remember'),
  dependents = require('gulp-dependents'),
  rtlcss = require('gulp-rtlcss'),
  gulpif = require('gulp-if'),
  lazypipe = require('lazypipe'),
  git = require('gulp-git'),
  ftp = require('vinyl-ftp');

const paths = {
  name: "boiler",
  prod: { //Куда складывать готовые файлы
    server: 'prod/',
    html: 'prod/',
    js: 'prod/js/',
    jsVendor: 'prod/js/',
    css: 'prod/css/',
    img: 'prod/img/',
    fonts: 'prod/css/fonts/',
    favicon: 'prod/favicon/'
  },
  build: { //Куда складывать готовые файлы
    server: 'build/',
    html: 'build/',
    js: 'build/js/',
    css: 'build/css/',
    img: 'build/img/',
    fonts: 'build/css/fonts/',
    favicon: 'build/favicon/'
  },
  src: { //Пути откуда брать исходники
    root: 'src/',
    pug: ['src/pug/*.pug', '!src/pug/_*.pug'], // компилирую только те файлы, что заканч. на *.pug
    js: 'src/js/script.js',
    jsVendor: 'src/js/vendor.js',
    scss: ['src/sass/**/*.scss', 'src/sass/_*.scss'],
    img: 'src/img/**/*.*',
    fonts: 'src/fonts/*',
    favicon: 'src/favicon/*'
  },
  watch: { //Пути файлов, за которыми хотим наблюдать
    pug: 'src/pug/**/*.pug',
    js: 'src/js/script.js',
    jsVendor: 'src/js/vendor.js',
    scss: ['src/sass/**/*.scss', 'src/sass/_*.scss'],
    img: 'src/img/**/*',
    favicon: 'src/favicon/*',
    fonts: 'src/fonts/*'
  }
};

const ftpConfig = {
  host: 'lum.zzz.com.ua',
  user: '',
  password: '',
  dest: '/lum.zzz.com.ua/projectFolder'
}

var production = false; //true //== false default
var gitRepo = 'git@github.com:5tka/nGulp.git';
var msgCommit = 'first commit'; // default

function favicon_fn() {
  return gulp.src(paths.src.favicon)
    .pipe(plumber())
    .pipe(gulpif(
      production,
      gulp.dest(paths.prod.favicon),
      gulp.dest(paths.build.favicon)
    ))
    .pipe(browserSync.stream());
}
function fonts_fn() {
  return gulp.src(paths.src.fonts)
    .pipe(plumber())
    .pipe(gulpif(
      production,
      gulp.dest(paths.prod.fonts),
      gulp.dest(paths.build.fonts)
    ))
    .pipe(browserSync.stream());
}
function imgmin_fn() {
  return gulp.src(paths.src.img)
    .pipe(plumber())
    .pipe(gulpif(
      production,
      imagemin({ optimizationLevel: 3, progressive: true })
    ))
    .pipe(gulpif(
      production,
      gulp.dest(paths.prod.img),
      gulp.dest(paths.build.img)
    ))
    .pipe(browserSync.stream());
}
function js_fn() {
  return gulp.src(paths.src.js)
    .pipe(plumber())
    .pipe(rigger())
    .pipe(gulpif(
      production,
      uglify()
    ))
    .pipe(concat('script.js'))
    .pipe(gulpif(
      production,
      gulp.dest(paths.prod.js),
      gulp.dest(paths.build.js)
    ))
    .pipe(browserSync.stream());
}
function jsV_fn() {
  return gulp.src(paths.src.jsVendor)
    .pipe(plumber())
    .pipe(rigger())
    .pipe(gulpif(
      production,
      uglify()
    ))
    .pipe(concat('vendor.js'))
    .pipe(gulpif(
      production,
      gulp.dest(paths.prod.js),
      gulp.dest(paths.build.js)
    ))
    .pipe(browserSync.stream());
}
function pug_fn() {
  return gulp.src(paths.src.pug)
    .pipe(print(filepath => "src " + filepath))
    .pipe(plumber())
    .pipe(print(filepath => "saved " + filepath))
    .pipe(pug({ pretty: true }))
    .on('error', console.log)
    .pipe(gulpif(
      production,
      gulp.dest(paths.prod.html),
      gulp.dest(paths.build.html)
    ))
    .pipe(browserSync.stream());
}

var sassPipeChain =
  lazypipe()
    .pipe(gcmq)
    .pipe(shorthand)
    .pipe(cssnano, 'discardComments: { removeAll: true }')
function sass_fn() {
  return gulp.src(paths.src.scss)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(rigger())
    .pipe(cache('sass'))
    .pipe(print(filepath => "file saved " + filepath))
    .pipe(dependents())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({ browsers: ['last 15 versions'] }))
    .pipe(
      gulpif(
        production,
        sassPipeChain()
      )
    )
    .pipe(remember('sass'))
    .pipe(concat('main.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulpif(
      production,
      gulp.dest(paths.prod.css),
      gulp.dest(paths.build.css)
    ))
    .pipe(browserSync.stream());
}
function criticalCss_fn() {
  return gulp.src('build/css/main.css')
    .pipe(criticalCss())
    .pipe(gulpif(
      production,
      gulp.dest(paths.prod.css),
      gulp.dest(paths.build.css)
    ))
}
// function rtl_fn() {
//   return gulp.src('build/css/main.css')
//     .pipe(rtlcss())
//     .pipe(rename({ suffix: '-rtl' }))
//     .pipe(gulpif(
//       production,
//       gulp.dest(paths.prod.css),
//       gulp.dest(paths.build.css)
//     ))
// }
// exports.rtl_fn = rtl_fn;

exports.criticalCss_fn = criticalCss_fn;
exports.imgmin_fn = imgmin_fn;
exports.sass_fn = sass_fn;

function watch_fn() {
  browserSync({
    server: {
      baseDir: paths.build.server
    },
    port: 8080,
    open: true,
  });
  gulp.watch(paths.watch.favicon, gulp.series(favicon_fn));
  gulp.watch(paths.watch.fonts, gulp.series(fonts_fn));
  gulp.watch(paths.watch.img, gulp.parallel(imgmin_fn));
  gulp.watch(paths.watch.js, gulp.series(js_fn));
  gulp.watch(paths.watch.jsVendor, gulp.series(jsV_fn));
  gulp.watch(paths.watch.pug, gulp.series(pug_fn));
  gulp.watch(paths.watch.scss, gulp.series(sass_fn));
};

var build = gulp.series(
  gulp.parallel(
    favicon_fn,
    fonts_fn,
    imgmin_fn,
    js_fn,
    jsV_fn,
    pug_fn,
    sass_fn,
  )
);

var prod = gulp.series(
  build
);

// ===========================
// var production = true;
gulp.task('prod', prod);
// ===========================

gulp.task('build', build);
gulp.task('default', gulp.series(build, watch_fn));


// ============================================================
// GOOGLE PAGE SPPED
// var psi = require('psi');
// var site = 'http://www.html5rocks.com';
// var key = '';
// gulp.task('psi-m', function () {
//   return psi(site, {
//       // key: key
//       nokey: 'true',
//       strategy: 'mobile',
//   }).then(function (data) {
//       console.log('Speed score: ' + data.ruleGroups.SPEED.score);
//       console.log('Usability score: ' + data.ruleGroups.USABILITY.score);
//   });
// });
// gulp.task('psi-d', function () {
//   return psi(site, {
//       nokey: 'true',
//       // key: key,
//       strategy: 'desktop',
//   }).then(function (data) {
//       console.log('Speed score: ' + data.ruleGroups.SPEED.score);
//       console.log('Usability score: ' + data.ruleGroups.USABILITY.score);
//   });
// });

// =============================================================
// ftp
function deploy() {

  var conn = ftp.create({
    host: ftpConfig.host,
    user: ftpConfig.user,
    password: ftpConfig.password,
    parallel: 10,
  });
  var globs = [
    'build/**'
  ];
  return gulp.src(globs, { base: '.', buffer: false })
    .pipe(conn.dest(ftpConfig.dest));
}
exports.deploy = deploy;


// ==============================================================
// git 
function init() {
  return git.init(function (err) {
    if (err) throw err;
  });
}
function add() {
  return gulp.src('./').pipe(git.add());
}
function commit() {
  return gulp.src('./').pipe(git.commit(msgCommit));
}
function addremote() {
  return git.addRemote('origin', gitRepo, (err) => {
    if (err) throw err;
  });
}
function push(done) {
  return git.push('origin', 'master', (err) => {
    if (err) throw err;
    done();
  });
}
function pull() {
  return git.pull('origin', 'master', { args: '--rebase' }, (err) => {
    if (err) throw err;
  });
}

var gitPushFirstCommit = gulp.series(
  init,
  add,
  commit,
  addremote,
  push
);
var gitPullPushCommit = gulp.series(
  add,
  commit,
  pull,
  push
);

// ===========================
gulp.task('push', gitPushFirstCommit);
// ===========================
gulp.task('pp', gitPullPushCommit);