/* config.h.  Generated automatically by configure.  */
/* config.h.in.  Generated automatically from configure.in by autoheader.  */
/*
 * Copyright (c) 2002
 * Neil Spring and the University of Washington.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. The name of the author(s) may not be used to endorse or promote
 *    products derived from this software without specific prior
 *    written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR(S) ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR(S) BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


#define _REENTRANT 1
/* #undef WITH_DMALLOC */
#define HAVE_STRUCT_UTIMBUF 1

/* Define if the `closedir' function returns void instead of `int'. */
/* #undef CLOSEDIR_VOID */

/* Define to one of `_getb67', `GETB67', `getb67' for Cray-2 and Cray-YMP
   systems. This function is required for `alloca.c' support on those systems.
   */
/* #undef CRAY_STACKSEG_END */

/* Define if using `alloca.c'. */
/* #undef C_ALLOCA */

/* Define if you have `alloca', as a function or macro. */
#define HAVE_ALLOCA 1

/* Define if you have <alloca.h> and it should be used (not on Ultrix). */
#define HAVE_ALLOCA_H 1

/* Define if you have the <check.h> header file. */
/* #undef HAVE_CHECK_H */

/* Define if you have the <dirent.h> header file, and it defines `DIR'. */
#define HAVE_DIRENT_H 1

/* Define if you have the <dmalloc.h> header file. */
/* #undef HAVE_DMALLOC_H */

/* Define if you have the <error.h> header file. */
#define HAVE_ERROR_H 1

/* Define if you have the <fcntl.h> header file. */
#define HAVE_FCNTL_H 1

/* Define if you have the <inttypes.h> header file. */
#define HAVE_INTTYPES_H 1

/* Define if you have the `check' library (-lcheck). */
/* #undef HAVE_LIBCHECK */

/* Define if you have the `dmallocth' library (-ldmallocth). */
/* #undef HAVE_LIBDMALLOCTH */

/* Define if you have the `pq' library (-lpq). */
/* #undef HAVE_LIBPQ */

/* Define if you have the `pthread' library (-lpthread). */
#define HAVE_LIBPTHREAD 1

/* Define if you have the <locale.h> header file. */
#define HAVE_LOCALE_H 1

/* Define if you have the <memory.h> header file. */
#define HAVE_MEMORY_H 1

/* Define if you have the `mkfifo' function. */
#define HAVE_MKFIFO 1

/* Define if you have the <ndir.h> header file, and it defines `DIR'. */
/* #undef HAVE_NDIR_H */

/* Define if you have the `snprintf' function. */
#define HAVE_SNPRINTF 1

/* Define if you have the <stdint.h> header file. */
#define HAVE_STDINT_H 1

/* Define if you have the <stdlib.h> header file. */
#define HAVE_STDLIB_H 1

/* Define if you have the <strings.h> header file. */
#define HAVE_STRINGS_H 1

/* Define if you have the <string.h> header file. */
#define HAVE_STRING_H 1

/* Define if `st_blocks' is member of `struct stat'. */
#define HAVE_STRUCT_STAT_ST_BLOCKS 1

/* Define if your `struct stat' has `st_blocks'. Deprecated, use
   `HAVE_STRUCT_STAT_ST_BLOCKS' instead. */
#define HAVE_ST_BLOCKS 1

/* Define if you have the <sys/dir.h> header file, and it defines `DIR'. */
/* #undef HAVE_SYS_DIR_H */

/* Define if you have the <sys/mkdev.h> header file. */
/* #undef HAVE_SYS_MKDEV_H */

/* Define if you have the <sys/ndir.h> header file, and it defines `DIR'. */
/* #undef HAVE_SYS_NDIR_H */

/* Define if you have the <sys/param.h> header file. */
#define HAVE_SYS_PARAM_H 1

/* Define if you have the <sys/stat.h> header file. */
#define HAVE_SYS_STAT_H 1

/* Define if you have the <sys/sysmacros.h> header file. */
#define HAVE_SYS_SYSMACROS_H 1

/* Define if you have the <sys/time.h> header file. */
#define HAVE_SYS_TIME_H 1

/* Define if you have the <sys/types.h> header file. */
#define HAVE_SYS_TYPES_H 1

/* Define if you have the <time.h> header file. */
#define HAVE_TIME_H 1

/* Define if you have the <unistd.h> header file. */
#define HAVE_UNISTD_H 1

/* Define if you have the `utimes' function. */
/* #undef HAVE_UTIMES */

/* Define if you have the <utime.h> header file. */
#define HAVE_UTIME_H 1

/* Define if `major', `minor', and `makedev' are declared in <mkdev.h>. */
/* #undef MAJOR_IN_MKDEV */

/* Define if `major', `minor', and `makedev' are declared in <sysmacros.h>. */
/* #undef MAJOR_IN_SYSMACROS */

/* Name of package */
#define PACKAGE "ally"

/* If using the C implementation of alloca, define if you know the
   direction of stack growth for your system; otherwise it will be
   automatically deduced at run-time.
        STACK_DIRECTION > 0 => grows toward higher addresses
        STACK_DIRECTION < 0 => grows toward lower addresses
        STACK_DIRECTION = 0 => direction of growth unknown */
/* #undef STACK_DIRECTION */

/* Define if you have the ANSI C header files. */
#define STDC_HEADERS 1

/* Define if your <sys/time.h> declares `struct tm'. */
/* #undef TM_IN_SYS_TIME */

/* Version number of package */
#define VERSION "0.1.0"
