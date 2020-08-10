import PropTypes from 'prop-types';
import React from 'react';
import { Route, Switch, withRouter } from 'react-router';

// Views
import About from '../views/About';
import Help from '../views/Help';
import Home from '../views/Home';
import NotFound from '../views/NotFound';
import Search from '../views/Search';
import LabelPropagation from '../views/LabelPropagation';
import Testing from '../views/Testing';

class Main extends React.Component {
  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0);
    }
  }

  render() {
    return (
      <Switch>
        <Route exact path="/about" component={About} />
        <Route exact path="/search" component={Search} />
        <Route exact path="/search/:id" component={Search} />
        <Route exact path="/help" render={Help.render} />
        <Route exact path="/label_prop/:id">
          <LabelPropagation />
        </Route>
        <Route exact path="/testing">
          <Testing />
        </Route>
        <Route exact path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    );
  }
}

Main.propTypes = {
  isAuthenticated: PropTypes.bool,
  location: PropTypes.object.isRequired
};

export default withRouter(Main);
