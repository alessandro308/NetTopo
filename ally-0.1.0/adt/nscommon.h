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

#ifndef _NS_COMMON_H
#define _NS_COMMON_H

#ifdef HAVE_CONFIG_H
#include <config.h>
#endif

#ifdef __LCLINT__
#define __STDC__
char *rindex(const char *s, char c); /* not really true; it's an int */
/*@dependent@*/char *index(const char *s, char c); /* not really true; it's an int */
char *strdup(const char *s);  /* probably a good annotation here */
/*@printflike@*/
int /*@alt void@*/ asprintf(/*@out@*/char **s, const char *fmt, ...);
/*@printflike@*/
int /*@alt void@*/ snprintf(/*@out@*/char *s, size_t x, const char *fmt, ...);
#endif

typedef unsigned char boolean;

#ifndef FALSE
#define FALSE 0
#endif
#ifndef TRUE
#define TRUE (!FALSE) 
#endif

#ifdef __LCLINT__
/* lclint doesn't do typeof */
#define min(x,y) ((x > y) ? x : y)
#define max(x,y) ((x > y) ? x : y)
#else
/* from linux/kernel.h */
#define min(x,y) ({ \
        const typeof(x) _x = (x);       \
        const typeof(y) _y = (y);       \
        (void) (&_x == &_y);            \
        _x < _y ? _x : _y; })
#define max(x,y) ({ \
        const typeof(x) _x = (x);       \
        const typeof(y) _y = (y);       \
        (void) (&_x == &_y);            \
        _x > _y ? _x : _y; })
#endif

#define DEBUG_PRINT(x...) do { } while (0)
// #define DEBUG_PRINT(x) fprintf(stderr, "%s:%d: %s\n", __FILE__, __LINE__, x);
#define DEBUG_PRINTL(x) fprintf(stderr, "%s:%d: %s", __FILE__, __LINE__, x);

#ifdef HAVE_STDINT_H
/* a linux-y thing */
#include <stdint.h>
#else
#include <sys/types.h>
#endif
typedef uint64_t macaddress;

#ifdef VERBOSE
#define VERBAL printf
#else
#define VERBAL nullie
#ifdef __linux__
/*@unused@*/ 
static __inline void nullie(/*@unused@*/ const char *format __attribute__ ((unused)), ...) {
  return;
}
#else 
#define nullie(x...) do {} while(0)
#endif
#endif

#define NEWPTR(type, name) type *name = (type *)malloc(sizeof(type)) 
#ifdef WITH_DMALLOC
#define NEWPTRX(type, name) NEWPTR(type, name); assert(name!=NULL);
#else
#define NEWPTRX(type, name) type *name = (type *)xmalloc(sizeof(type)) 
#endif

#endif
/*
vi:ts=2
*/
