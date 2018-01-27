#!/usr/bin/lua

--
-- Copyright (c) 2018 Frank Eberle // www.frank-eberle.de
--
-- This is a small wrapper script to use uhttpd on LEDE / OpenWRT
-- devices as a server for MCcontrol.
--
-- Usage: uhttpd_wrapper.lua <UID> <GID> <DOCROOT>
--



require "os"
require "nixio"
require "io"

pidFileName = "/var/run/mc_uhttpd.pid"

function abort(msg)
	print("Error: " .. msg .. "\n")
	os.remove(pidFileName)
	os.exit(1)
end

if #arg ~= 3 then
	abort("Unexpected number of command line parameters")
end
uid = arg[1]
gid = arg[2]
docroot = arg[3]

pid = nixio.fork()
if pid == 0 then
	if not nixio.setgid(tonumber(gid)) then
		abort("Failed to set group ID; " .. nixio.strerror(nixio.errno()))
	end
	if not nixio.setuid(tonumber(uid)) then
		abort("Failed to set user ID; " .. nixio.strerror(nixio.errno()))
	end
	nixio.exec("/usr/sbin/uhttpd", "-f", "-p", "8080", "-h", docroot)
	abort("Failed to run uhttpd;" .. nixio.strerror(nixio.errno()))
end

pidFile = io.open(pidFileName, "w")
pidFile:write(pid)
pidFile:close()

