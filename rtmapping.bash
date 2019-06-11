#!/usr/bin/bash

Folder=~/oneMap-Project/$1/map

mkdir -p $Folder
cd $Folder
pwd
rosbag record /mapper_points