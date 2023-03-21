import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './onsets.css';

const Onsets = function(props) {

  console.log(props.width);
  const pct_len = 100 / props.audio_length_ms;
  const width_one_pct = 808 / 100;
  const onsets = Object.values(props.onsets).map((data,index) => 
    <div key={index} style={{left: data * pct_len * width_one_pct}} className={classNames(styles.vl)}/>
  );
  return (
    <div className={classNames(styles.container)}>
    {onsets}
    </div>
  );
}

export default Onsets;
