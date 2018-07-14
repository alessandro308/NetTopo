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

#include <config.h>
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#ifdef HAVE_LIBPQ
#include <postgresql/libpq-fe.h>
#include "postgresql.h"

/* when you don't care about the result, just perhaps
   that it succeeded.  "alt void" keeps lclint from 
   complaining if we don't check the return code */;
boolean  /*@alt void@*/
db_do_command(PGconn *conn, const char *querybuf) {
  static int reprieves;
  PGresult   *res;
  res = PQexec(conn, querybuf);
  if (PQresultStatus(res) != PGRES_COMMAND_OK) {
    printf("failed to %s\n", querybuf);
    printf("res->status = %s\n", PQresStatus(PQresultStatus(res))); 
    PQclear(res);
    if(reprieves++ > 5) {
      exit(EXIT_FAILURE);
    }
    return FALSE;
  }
  PQclear(res);
  return TRUE;
}

boolean 
db_do_query(PGconn *conn, const char *querybuf,
            void (*row_cb)(const char **, void *a),
            void *a) {

  PGresult *res = PQexec(conn, querybuf);
  if (PQresultStatus(res) != PGRES_TUPLES_OK && 
      PQresultStatus(res) != PGRES_EMPTY_QUERY) {
    printf("db failed: %s\n", querybuf);
    printf("res->status = %s\n", PQresStatus(PQresultStatus(res))); 
    exit(EXIT_FAILURE);
  }
  if(row_cb != NULL) {
    int nFields = PQnfields(res);
    const char **pass = malloc(sizeof(char *) * nFields);
    int i;
    for (i = 0; i < PQntuples(res); i++) {
      int j;
      for(j=0;j<nFields;j++) {
        pass[j] = PQgetvalue(res,i,j);
      }
      row_cb(pass, a);
    } 
    free(pass);
  }
  PQclear(res);
  return TRUE;
}

boolean db_begin_transaction(PGconn *conn) {
  return db_do_command(conn, "begin");
}
boolean db_commit_transaction(PGconn *conn) {
  /* could check nesting or something ? */
  return db_do_command(conn, "commit");
}

PGconn *db_connect(void) {
  static PGconn *conn;  /* cache the connection, if already made */
  char * connectstring;
  if(conn == NULL) {
    asprintf(&connectstring, 
             "host=jimbo.cs.washington.edu dbname=mapping user=%s", 
             getenv("USER")); 
    conn = PQconnectdb(connectstring);
    free(connectstring);
  }
  return (conn);
}
#endif

