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

#ifdef HAVE_CONFIG_H
#include <config.h>
#endif
#include "red_transitive.h"
#include "string_bindings.h"
#include "nscommon.h"

#ifdef HAVE_LIBPQ
#ifdef __LCLINT__
    typedef enum
      {
        PGRES_EMPTY_QUERY = 0,
        PGRES_COMMAND_OK,       /* a query command that doesn't return
                                 * anything was executed properly by the
                                 * backend */
        PGRES_TUPLES_OK,        /* a query command that returns tuples was
                                 * executed properly by the backend,
                                 * PGresult contains the result tuples */
        PGRES_COPY_OUT,         /* Copy Out data transfer in progress */
        PGRES_COPY_IN,          /* Copy In data transfer in progress */
        PGRES_BAD_RESPONSE,     /* an unexpected response was recv'd from
                                 * the backend */
        PGRES_NONFATAL_ERROR,
        PGRES_FATAL_ERROR
      } ExecStatusType;
typedef struct pg_result *PGresult;
typedef struct pg_conn *PGconn;
void PQclear(/*@only@*/ PGresult res);
/*@dependent@*/ const char *PQresStatus(ExecStatusType e);
extern ExecStatusType PQresultStatus(const PGresult *res);
extern /*@dependent@*/char *PQgetvalue(const PGresult *res, int tup_num, int field_num);
extern /*@dependent@*/char *PQerrorMessage(const PGconn *conn);
#else
#include "libpq-fe.h"
#endif

boolean
load_db_aliases(PGconn *conn,
                red_transitive rtm,
                string_bindings sb_ip,
                unsigned short targ_asn,
                boolean all_edges); /* not just red edges */

string_bindings
populate_strings_db(PGconn *conn, const char *tablename, const char *asname);

void
dump_aliases_db(PGconn *conn, const red_transitive rtm,
                const string_bindings sb_ip, unsigned short targ_asn);
boolean
load_router_list(unsigned short targ_asn,
                 const char *targ_asname,
                 /*@null@*/const char *aux_filename,
                 /*@out@*/ PGconn **conn,
                 /*@out@*/ string_bindings *sb_both,
                 /*@out@*/ string_bindings *sb_ip);

boolean
foreach_ally(PGconn *conn, unsigned short targ_asn,
             const string_bindings sb_ip,
             const char *description,
             boolean all_edges, /* not just red ones */
             void (*alias_cb)(PGconn *conn,
                              const string_bindings sb_ip,
                              unsigned short node1,
                              unsigned short node2,
                              int ipid,
                              int return_ttl,
                              void *a),
             /*@null@*/void *a);
#endif /* libpq */

/* can exist without libpq, though it's not clear that's helpful */
void
dump_aliases(const red_transitive rtm,
             const string_bindings sb_ip);

void
dump_aliases_jgr(const red_transitive rtm, const char *jgr_output);
void
dump_aliases_xpm(const red_transitive rtm, const char *xpm_output);

string_bindings extract_and_dup(string_bindings sb_both);

/*@null@*/
string_bindings populate_strings(const char *filename);

