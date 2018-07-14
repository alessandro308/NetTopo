dnl -*-Autoconf-*-
dnl macros used to setup all that adt requires. 
dnl and macros I always use.

AC_DEFUN(AC_NSPRING_CHECK_CACHE, 
   [
    AC_MSG_CHECKING(cached information)
    hostcheck="$host"
    AC_CACHE_VAL(ac_cv_hostcheck, [ ac_cv_hostcheck="$hostcheck" ])
    if test "$ac_cv_hostcheck" != "$hostcheck"; then
      AC_MSG_RESULT(changed)
      AC_MSG_WARN(config.cache exists!)
      AC_MSG_ERROR(you must make distclean first to compile for different host)
    else
      AC_MSG_RESULT(ok)
    fi
    ])

AC_DEFUN(AC_NSPRING_PROG_CC,    [
    AC_PROG_CC
    if test -n "$GCC"; then
      AC_MSG_RESULT(adding -Wall and friends to CFLAGS.)
      CFLAGS="$CFLAGS -W -Wall -Wshadow -Wpointer-arith -Wtraditional -Wwrite-strings -Wstrict-prototypes -Wredundant-decls"
    fi
    ])


AC_DEFUN(AC_NSPRING_PATH_PROGS, [
         AC_PATH_PROG(LINT,  splint, "./missing splint")
         AC_PATH_PROG(DOT,   dot,    "./missing dot")
         AC_PATH_PROG(CVSCL, cvs2cl, "./missing cvs2cl")
         AC_SUBST(CVSCL) ])

AC_DEFUN(AC_NSPRING_ADT, [
         AC_NSPRING_PATH_PROGS
         AC_PROG_RANLIB
         AC_PROG_INSTALL
         AC_PROG_MAKE_SET

         dnl Checks for libraries.
         AC_CHECK_LIB(pthread, pthread_cond_init)

         AC_CHECK_FUNC(getopt_long, GETOPT_OBJ="" GETOPT_SRC="", \
         GETOPT_SRC="getopt.c getopt1.c" GETOPT_OBJ="getopt.o getopt1.o")
         AC_SUBST(GETOPT_SRC)
         AC_SUBST(GETOPT_OBJ)

         AC_CHECK_HEADER(postgresql/libpq-fe.h)
         AC_CHECK_LIB(pq, main)

         AC_HAVE_FUNCS(snprintf)
         dnl check.sourceforge.net
         AC_CHECK_HEADERS(check.h)
         AC_CHECK_LIB(check,suite_create)

         AC_DEFINE(_REENTRANT)
])
