noinst_PROGRAMS = test_eventqueue test_set check_si check_typed_hash check_string_bind bench-recursively
TESTS = check_si check_typed_hash check_string_bind
EXTRA_DIST = README neils_adt.m4

test_eventqueue_SOURCES = test_eventqueue.c eventqueue.h \
	eventqueue.c queue.c queue.h

test_set_SOURCES = test_set.c set.h set.c 

check_si_SOURCES = check_si.c
check_si_LDADD = libadt.a
check_typed_hash_SOURCES = check_typed_hash.c
check_typed_hash_LDADD = libadt.a
check_string_bind_SOURCES = check_string_bind.c
check_string_bind_LDADD = libadt.a

bench_recursively_SOURCES = bench-recursively.c
bench_recursively_LDADD = libadt.a

noinst_LIBRARIES = libadt.a libgadt.a

libadt_a_SOURCES = hashtable.c hashtable.h \
	typed_hashtable.h \
	queue.c queue.h \
	typed_queue.h \
	timeseries.c timeseries.h \
	eventqueue.c eventqueue.h \
	sprinter.c sprinter.h \
	hashes.c hashes.h \
	alert.c alert.h \
	hprop.c hprop.h \
	buffer.c buffer.h \
	table.c table.h \
	hpropinterface.c hpropinterface.h \
	sorted_intlist.c sorted_intlist.h \
	sorted_stringlist.c sorted_stringlist.h \
	red_transitive.c red_transitive.h \
	link_matrix.c link_matrix.h \
	disjoint_set.c disjoint_set.h \
	string_bindings.c string_bindings.h \
	progress.c progress.h \
	postgresql.c postgresql.h \
	distribution.c distribution.h \
	set.c set.h \
	join.c join.h \
	commando.c commando.h \
	recursively.c recursively.h \
	sockaddr.c  \
	snprintf.c \
	nscommon.h 
libadt_a_LIBADD = @GETOPT_OBJ@
libadt_a_DEPENDENCIES = @GETOPT_OBJ@

EXTRA_libadt_a_SOURCES = getopt.c getopt.h getopt1.c

libgadt_a_SOURCES = graphing_ts.c graphing_ts.h

%.lint: %.c Makefile .lclintrc
	$(LINT) +unixlib -exportlocal $(AM_CFLAGS) $(DEFS) $(DEFAULT_INCLUDES) $< | tee $@

%.E: %.c
	$(CC) -E $(INCLUDES) $(DEFS) $< > $@

INCLUDES = -I$(srcdir)/.. -I$(srcdir)
