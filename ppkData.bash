#!/usr/bin/bash

Folder=~/oneMap-Project/$1/map

mkdir -p $Folder
cd $Folder
pwd
rosbag record /velodyne_points /utc_time /ppk_quat