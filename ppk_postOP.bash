#!/usr/bin/bash

Folder=~/oneMap-Project/$1/map
# Folder=~/lidar_bag/coba1

cd $Folder
mkdir pcd
pwd
sleep 3
rosrun pcl_ros bag_to_pcd *.bag /velodyne_points ./pcd/
sleep 3
rosrun trajectory_logger ppk_bag_to_pkl *.bag ./pkl/