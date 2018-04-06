# FD2-scratch-map


Application uses MongoDB. You need to install MongoDB, download and restore a database to use the application correctly.
Warning! Application uses default Mongo port (27017). If you intend to use a different one, please change settings @server.js line 12.

Navigate to /mongo and download scratchmap folder
Use $ mongorestore --drop -d scratchmap <downloaded-dir-path>
