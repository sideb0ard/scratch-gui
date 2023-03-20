import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './onsets.css';

const Onsets = (props) => (
    <div className={classNames(styles.container)}>
      { props.onsets ? 
          props.onsets.map(item => (<div/>))
        :
          console.log("NAHHH")
      }
    </div>
);

Onsets.propTypes = {
    className: PropTypes.string,
};

export default Onsets;
