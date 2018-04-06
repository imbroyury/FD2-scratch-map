# FD2-scratch-map

**-Download the repo**
**-Set up MongoDB:**
You need to install MongoDB, download and restore a database to use the application correctly. Database is uploaded to /mongo/scratchmap folder

Use CMD:
  -navigate to the folder where MongoDB is installed
  -navigate to /bin
  -use mongorestore --drop -d scratchmap <path to /mongo/scratchmap>

Warning! By default application uses port 3000 & Mongo port 27017. If you intend to use a different one, please change settings at server.js file.

**-run npm install**
**-run npx webpack**
**-run node server**

All set! Go to your browser of choice (best viewed in Chrome!) and open the application at localhost:/3000
