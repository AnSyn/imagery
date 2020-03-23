#!/bin/bash
BUILDS=("imagery" "imagery-ol" "imagery-cesium" "imagery-video")
len=${#BUILDS[*]}
for (( i=0; i<len; i++ ))
do
    ng build @ansyn/${BUILDS[$i]} || exit 1
done

