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

#ifndef _typed_hashtable_h
#define _typed_hashtable_h
#include "hashtable.h"

#define DECLARE_TYPED_HASHTABLE(type, pr)                                         \
struct pr##hashtable_struct;                                                      \
typedef struct pr##hashtable_struct *pr##_hashtable;                              \
/*@unused@*/                                                                      \
static __inline void                                                              \
pr##_ht_delete(/*@only@*/ pr##_hashtable d, boolean pro) {                        \
  ht_delete((hashtable)d, pro);                                                   \
}                                                                                 \
typedef unsigned int (*pr##_hash_fn)(const type *k);                              \
typedef boolean (*pr##_iseq_fn)(const type *k1, const type *k2);                  \
typedef type *(*pr##_ht_constructor_cb)(const type *k1);                          \
typedef boolean (*pr##_ht_iterator_cb)(const type *keyval, void *user);           \
typedef void (*pr##_ht_delete_cb)(type *keyval);                                  \
/*@unused@*/                                                                      \
static __inline pr##_hashtable                                                    \
pr##_ht_new(unsigned int s,                                                       \
            pr##_hash_fn hash, pr##_iseq_fn iseq,                                 \
            pr##_ht_delete_cb freek) {                                            \
  return((pr##_hashtable)ht_new(s, (hash_cb)hash, (isequal_cb)iseq,               \
                                (delete_cb)freek));                               \
}                                                                                 \
/*@unused@*/                                                                      \
static __inline void                                                              \
pr##_ht_insert(pr##_hashtable h, /*@owned@*/ type *k) {                           \
  ht_insert((hashtable)h, k);                                                     \
}                                                                                 \
/*@unused@*/                                                                      \
static __inline void                                                              \
pr##_ht_remove(pr##_hashtable h, type *k) {                                       \
  ht_remove((hashtable)h, k);                                                     \
}                                                                                 \
/*@unused@*/                                                                      \
static __inline /*@null@*/ /*@dependent@*/ type *                                 \
pr##_ht_lookup(pr##_hashtable h, /*@out@*/ const type *k) {                       \
   /*out = not neccessarily defined */                                            \
  return((type *)ht_lookup((hashtable)h,k));                                      \
}                                                                                 \
/*@unused@*/                                                                      \
static __inline /*@dependent@*/ type *                                            \
pr##_ht_lookup_nofail(pr##_hashtable h,                                           \
                         const type *key,                                         \
                         type *(*constructor)(const type*k)) {                    \
  return(ht_lookup_nofail((hashtable)h, key, (ht_constructor_cb)constructor));    \
}                                                                                 \
/*@unused@*/                                                                      \
static __inline boolean                                                           \
pr##_ht_iterate(pr##_hashtable h,                                                 \
                pr##_ht_iterator_cb cb,                                          \
                void *user) {                                                     \
  return(ht_iterate((hashtable)h,(ht_iterator_cb)cb,user));                       \
}                                                                                 \
/*@unused@*/                                                                      \
static __inline unsigned long                                                     \
pr##_ht_count(pr##_hashtable h) {                                                 \
return(ht_count((hashtable)h));                                                   \
}                                                                                 \
/*@unused@*/                                                                      \
static __inline void                                                              \
pr##_ht_occupancyjgr(const pr##_hashtable h, const char *fname) {                 \
  ht_occupancyjgr((const hashtable)h, fname);                                     \
}                                                                                 \
                                                                                  \
/*@unused@*/                                                                      \
static __inline void                                                              \
pr##_ht_free_entry(pr##_hashtable ht, type *keyval) {                             \
  ht_free_entry((hashtable)ht, keyval);                                           \
}

#define DECLARE_TYPED_HASHTABLE_K(type, keytype, pr)                              \
DECLARE_TYPED_HASHTABLE(type, pr); \
typedef unsigned int (*pr##_hash_k_fn)(const keytype *k);                         \
typedef boolean (*pr##_iseq_k_fn)(const keytype *k1, const keytype *k2);          \
/*@unused@*/                                                                      \
static __inline /*@null@*/ /*@dependent@*/ type *                                 \
pr##_ht_lookup_k(pr##_hashtable h, const keytype *k) {                            \
  return((type *)ht_lookup((hashtable)h,k));                                      \
}                                                                                 \
/*@unused@*/                                                                      \
static __inline pr##_hashtable                                                    \
pr##_ht_new_k(unsigned int s,                                                     \
            pr##_hash_k_fn hash, pr##_iseq_k_fn iseq,                             \
            pr##_ht_delete_cb freek) {                                            \
  return((pr##_hashtable)ht_new(s, (hash_cb)hash, (isequal_cb)iseq,               \
                                (delete_cb)freek));                               \
}                                                                                 \



#endif
