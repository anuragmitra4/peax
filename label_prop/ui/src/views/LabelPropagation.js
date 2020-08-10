import React from 'react';
import RectangleSelection from 'react-rectangle-selection';
import update from 'immutability-helper';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import './LabelPropagation.css';

// Components
import Content from '../components/Content';
import ContentWrapper from '../components/ContentWrapper';
import HiGlassViewer from '../components/HiGlassViewer';
import HiglassNeighborhoodResultList from '../components/HiGlassNeighborhoodResultList';
import SpinnerCenter from '../components/SpinnerCenter';

// Higher-order components
import { withPubSub } from '../hocs/pub-sub';

// Utils
import { api, numToClassif, classifToNum } from '../utils';

class LabelPropagation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      seeds: null,
      viewconfId: null,
      viewconf: null,
      searchInfo: null,
      searchInfoList: null,
      isLoading: true,
      windows: {},
      isLoadingClassifications: false,
      isErrorClassifications: false,
      classifications: {},
      mouseDownId: null,
      mouseUpId: null,
      classifButtonIcon: null
    };
  }

  // Getter for the search ID
  get id() {
    return this.props.match.params.id;
  }

  componentDidMount() {
    this.seeds(this.id);
    this.loadMetaData();
    this.loadClassifications();
  }

  seeds = async () => {
    const seeds = await api.getSeeds(this.id);
    await this.setState({ seeds: seeds.body.results });
  };

  loadMetaData = async () => {
    let dataTracks = await api.getDataTracks();

    let isError =
      dataTracks.status !== 200 ? "Couldn't load data tracks" : false;
    dataTracks = isError ? null : dataTracks.body.results;

    // searchInfo for the Search Target and Seed
    let searchInfo = await api.getSearchInfo(`${this.id}.n`);
    isError = searchInfo.status !== 200 ? "Couldn't load search info." : false;
    if (!isError) {
      searchInfo = searchInfo.body;
    } else {
      searchInfo = null;
    }

    // searchInfo for Higlass list instances
    let searchInfoList = await api.getSearchInfo(`${this.id}.l`);
    isError =
      searchInfoList.status !== 200 ? "Couldn't load search info." : false;
    if (!isError) {
      searchInfoList = searchInfoList.body;
    } else {
      searchInfoList = null;
    }

    this.setState({ searchInfo, searchInfoList, isLoading: false });
  };

  loadClassifications = async () => {
    if (this.state.isLoadingClassifications) return;

    this.setState({
      isLoadingClassifications: true,
      isErrorClassifications: false
    });

    let classifications = await api.getClassifications(this.id);
    const isErrorClassifications =
      classifications.status !== 200 ? "Could't load classifications." : false;
    classifications = isErrorClassifications
      ? []
      : classifications.body.results;

    const windows = { ...this.state.windows };
    classifications.forEach(({ windowId, classification }) => {
      windows[windowId] = {
        classification: numToClassif(classification),
        classificationNumerical: classification,
        classificationPending: false
      };
    });

    this.setState({
      isLoadingClassifications: false,
      isErrorClassifications,
      classifications,
      windows
    });
  };

  classificationChangeHandler = windowId => {
    return async classif => {
      const isNew = !this.state.windows[windowId];
      // const oldClassif = !isNew && this.state.windows[windowId].classification;

      if (
        (!isNew && this.state.windows[windowId].classificationPending) ||
        (isNew && classif === 'neutral')
      ) {
        return;
      }

      // Array created with the windowId of all instances preceeding the one clicked
      const newWindowIds = this.state.seeds.slice(
        0,
        this.state.seeds.indexOf(windowId) + 1
      );

      // Optimistic update for each element in newWindowIds
      newWindowIds.forEach(id => {
        this.setState(prevState => ({
          windows: update(prevState.windows, {
            [id]: win =>
              update(win || {}, {
                classification: { $set: classif },
                classificationNumerical: { $set: classifToNum(classif) },
                // classificationPending set to false since it's only a UI update
                // thus waiting for a server response is not required
                classificationPending: { $set: false }
              })
          })
        }));
      });

      // The next section of the function sends the classification of the instance clicked to the server

      // // Optimistic update
      // this.setState({
      //   windows: update(this.state.windows, {
      //     [windowId]: win =>
      //       update(win || {}, {
      //         classification: { $set: classif },
      //         classificationNumerical: { $set: classifToNum(classif) },
      //         classificationPending: { $set: true }
      //       })
      //   })
      // });

      // const setNewClassif = classif === 'positive' || classif === 'negative';

      // // Experimental: API calssification request is only sent for the clicked instance
      // // (not the instances which got automatically selected)

      // const response = setNewClassif
      //   ? await api.setClassification(this.id, windowId, classif)
      //   : await api.deleteClassification(this.id, windowId, classif);

      // // Set confirmed classification for all selected windowIds
      // // (even though only one classification request was confirmed actually!)

      // newWindowIds.forEach(async id => {
      //   this.setState({
      //     windows: update(this.state.windows, {
      //       [id]: {
      //         classification: {
      //           $set: response.status === 200 ? classif : oldClassif
      //         },
      //         classificationNumerical: {
      //           $set: classifToNum(
      //             response.status === 200 ? classif : oldClassif
      //           )
      //         },
      //         classificationPending: { $set: false }
      //       }
      //     })
      //   });
      // });

      // // Send the new classification back to the server
      // const response = setNewClassif
      //   ? await api.setClassification(this.id, windowId, classif)
      //   : await api.deleteClassification(this.id, windowId, classif);

      // // Set confirmed classification
      // this.setState({
      //   windows: update(this.state.windows, {
      //     [windowId]: {
      //       classification: {
      //         $set: response.status === 200 ? classif : oldClassif
      //       },
      //       classificationNumerical: {
      //         $set: classifToNum(response.status === 200 ? classif : oldClassif)
      //       },
      //       classificationPending: { $set: false }
      //     }
      //   })
      // });

      // const numNewClassif = setNewClassif ? 1 : -1;

      // this.setState({
      //   searchInfo: update(this.state.searchInfo, {
      //     classifications: {
      //       $set: this.state.searchInfo.classifications + numNewClassif
      //     }
      //   })
      // });
    };
  };

  onNormalize = () => {};

  setMouseDown = (mouseDownId, buttonIconName) => {
    // Icon name of button used to identify the classification
    // buttonIconName is either 'checkmark' or 'cross'
    this.setState({ mouseDownId, classifButtonIcon: buttonIconName });
  };

  onMouseUp = mouseUpwindowId => {
    if (mouseUpwindowId === -1 || this.state.mouseDownId === mouseUpwindowId) {
      // Checks if mouseUp is on a valid instance in the list
      // Also checks whether mouseDown and mouseUp are on the same instance (a button click)
      return;
    }

    const indexOfMouseDownWindow = this.state.seeds.indexOf(
      this.state.mouseDownId
    );
    const indexOfMouseUpWindow = this.state.seeds.indexOf(mouseUpwindowId);

    // Creates an array of selected windowIds
    const newWindowIds =
      indexOfMouseDownWindow < indexOfMouseUpWindow
        ? this.state.seeds.slice(
            indexOfMouseDownWindow,
            indexOfMouseUpWindow + 1
          )
        : this.state.seeds.slice(
            indexOfMouseUpWindow,
            indexOfMouseDownWindow + 1
          );

    const classif =
      this.state.classifButtonIcon === 'cross' ? 'negative' : 'positive';

    // Optimistic update for each element in newWindowIds
    newWindowIds.forEach(id => {
      this.setState(prevState => ({
        windows: update(prevState.windows, {
          [id]: win =>
            update(win || {}, {
              classification: { $set: classif },
              classificationNumerical: { $set: classifToNum(classif) },
              classificationPending: { $set: false }
            })
        })
      }));
    });

    // Not sending any of the classifications back to the server
  };

  render() {
    return (this.state.seeds &&
      this.state.searchInfo &&
      !this.state.isLoadingClassifications) === null ? (
      <SpinnerCenter />
    ) : (
      <ContentWrapper name="search">
        <Content name="search">
          <h4 className="heading">Search Target 🔍</h4>
          <div className="rel search-target higlass_bordered">
            <HiGlassViewer
              viewConfigId={`${this.id}..n`}
              isZoomFixed={true}
              height={this.state.searchInfo.viewHeight}
            />
          </div>
          <h4 className="heading">Seed</h4>
          <div className="rel search-target higlass_bordered">
            <HiGlassViewer
              viewConfigId={`${this.id}..n`}
              isZoomFixed={true}
              height={this.state.searchInfo.viewHeight}
            />
          </div>
          <hr />

          <h4 className="heading">List {'\u2728'}</h4>
          <RectangleSelection
            onSelect={(e, coords) => {
              this.setState({
                origin: coords.origin,
                target: coords.target
              });
            }}
            onMouseUp={() => this.onMouseUp(this.props.hover)}
            style={{
              backgroundColor: 'rgba(0,0,255,0.4)',
              borderColor: 'blue'
            }}
            disabled={false}
          >
            <div
              className="rel search-results higlass_neighborhood_list"
              style={{
                height:
                  (this.state.searchInfoList.viewHeight + 10) *
                  this.state.seeds.length
              }}
            >
              <HiglassNeighborhoodResultList
                isLoading={this.state.isLoading}
                isEmpty={'No samples found!'}
                isMoreLoadable={false}
                isTraining={false}
                list={this.state.seeds.map(windowId => ({
                  classification: undefined,
                  classificationChangeHandler: this.classificationChangeHandler,
                  setMouseDown: this.setMouseDown,
                  dataTracks: this.state.dataTracks,
                  hidePredProb: true,
                  normalizationSource: undefined,
                  normalizeBy: undefined,
                  onNormalize: this.onNormalize,
                  searchId: this.state.searchInfo.id,
                  viewHeight: this.state.searchInfoList.viewHeight,
                  windowId: parseInt(windowId, 10),
                  windows: this.state.windows
                }))}
              />
            </div>
          </RectangleSelection>
        </Content>
      </ContentWrapper>
    );
  }
}

const mapStateToProps = state => {
  return {
    hover: state.present.searchHover
  };
};

LabelPropagation.propTypes = {
  match: PropTypes.object,
  hover: PropTypes.number
};

export default connect(mapStateToProps)(
  withRouter(withPubSub(LabelPropagation))
);
