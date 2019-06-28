#!/usr/bin/bash

Folder=~/oneMap-Project/$1/map
# Folder=~/lidar_bag/coba1

cd $Folder
mkdir pcd
pwd
sleep 3
rosrun pcl_ros bag_to_pcd *.bag /mapper_points ./pcd/