#!/usr/bin/bash

Folder=~/oneMap-Project/$1/bag

mkdir -p $Folder
cd $Folder
pwd
rosbag record /ekf_euler /ekf_nav /ekf_quat /gps_pos /mag /utc_time /velodyne_points