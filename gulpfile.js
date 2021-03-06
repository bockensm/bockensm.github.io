const gulp = require("gulp")
const browserSync = require("browser-sync")
const cache = require("gulp-cache")
const cleanCSS = require("gulp-clean-css")
const cp = require("child_process")
const del = require("del")
const imagemin = require("gulp-imagemin")
const pngquant = require("imagemin-pngquant")
const prefix = require("gulp-autoprefixer")
const rename = require("gulp-rename")
const sass = require("gulp-sass")

const jekyll = process.platform === "win32" ? "jekyll.bat" : "jekyll"

const cleanCSSOptions = {
  level: {
    1: {
      selectorsSortingMethod: false
    }
  }
}

// Build the Jekyll Site
gulp.task("jekyll-build", done => {
  return cp.spawn(jekyll, [ "build" ], { stdio: "inherit" })
    .on("close", done)
})

// Rebuild Jekyll and page reload
gulp.task("jekyll-rebuild", () => {
  browserSync.reload()
})

// Wait for jekyll-build, then launch the Server
gulp.task("browser-sync", () => {
  browserSync({
    server: {
      baseDir: "_site"
    },
    notify: false
  })
})

gulp.task("normalize-copy", () => {
  return gulp.src("node_modules/normalize.css/normalize.css")
    .pipe( rename("_normalize.scss") )
    .pipe( gulp.dest("assets/css/scss/") )
})

// Compile files
gulp.task("sass-compile", () => {
  return gulp.src("assets/css/scss/main.scss")
    .pipe(sass({
      outputStyle: "expanded",
      onError: browserSync.notify
    }))
    .pipe( prefix(["last 15 versions", "> 1%", "ie 8", "ie 7"], { cascade: true }) )
    .pipe( cleanCSS(cleanCSSOptions) )
    .pipe( rename("main.min.css") )
    .pipe( gulp.dest("_site/assets/css") )
    .pipe( browserSync.reload({ stream: true }) )
    .pipe( gulp.dest("assets/css") )
})

gulp.task("sass-lint", () => {
  const stylelint = require("gulp-stylelint")

  return gulp.src([
      "assets/css/scss/**/*.scss",
      "!assets/css/scss/_normalize.scss"
    ])
    .pipe(
      stylelint({
        failAfterError: true,
        reporters: [
          { formatter: "string", console: true }
        ]
      })
    )
})

gulp.task("styles", gulp.series("sass-lint", "normalize-copy", "sass-compile"))

// Compression images
gulp.task("img", () => {
  return gulp.src("assets/img/**/*")
    .pipe(
      cache(
        imagemin({
          interlaced: true,
          progressive: true,
          svgoPlugins: [{ removeViewBox: false }],
          use: [pngquant()]
        })
      )
    )
    .pipe(gulp.dest("_site/assets/img"))
    .pipe(browserSync.reload({ stream: true }))
})

// Watch scss, html, img files
gulp.task("watch", () => {
  gulp.watch("assets/css/scss/**/*.scss", gulp.task("styles"))
  // gulp.watch("assets/js/**/*.js", gulp.series("jekyll-build", "jekyll-rebuild"))
  // gulp.watch("assets/img/**/*", gulp.task("img"))
  // gulp.watch(["*.html", "_layouts/*.html", "_includes/*.html", "_pages/*.html", "_posts/*"], gulp.series("jekyll-build", "jekyll-rebuild"))
})

//  Default task
gulp.task("default", gulp.series("styles", "img", "jekyll-build", "browser-sync", "watch"))
