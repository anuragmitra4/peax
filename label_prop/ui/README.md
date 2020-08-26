## Overview 

This version of Peax has `/label_prop` which implements a multi-instance visual interactive learning model. 

## Changes introduced in 

1. Main.js: Added the page <LabelPropagation />
2. /views/LabelPropagation
3. /components/HiGlassNeighborhoodResultList
4. /components/HiglassNeighborhoodResultUiOnly
5. /components/with-higlass-list-neighborhood: Only one change on line 13.
6. /components/ButtonRadio
7. /components/ButtonIcon

## Quick Start Guide for development

1. Clone the repository and download the packages in an environment
```
git clone https://github.com/Novartis/peax peax && cd peax
conda env create -f environment.yml && conda activate px
make install
```

2. Start the backend server to serve your data
```
python start.py -d -c <CONFIG>
```

3. Change the directory so that you are in the appropriate directory for the label propagation version of Peax. Then npm start the React app.
```
cd label_prop
cd ui 
npm start
```

4. Create a new search in Peax.

5. In order to access the label propagation page, use the endpoint '/label_prop/<SEARCH_ID>' in the url!
Note: The label propagation page requires a search to already exist so make sure you create one as suggested in the previous step.
