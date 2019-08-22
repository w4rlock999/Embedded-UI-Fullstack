import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import './timeline.css';
import Typography from '@material-ui/core/Typography';

import './Font.css';

function timeline(props) {

    // const { classes } = props;
    const statusPushed = props.statusPushed;

    return (
        
        <div className="baseContainer">
            <div className="timeline"></div>
            
            {statusPushed.map(status => (                
                <div className="blockContainer">
                    
                    <div className="timestamp">
                        <p className="timestamp-text" style={{fontFamily: 'samsung-one-600', fontSize: '12px'}}>
                            {status.time}
                        </p>
                    </div>
                    <div className="paperContainer" >
                        <Paper className="paper" elevation={1}>
                                <p className="timeline-text" style={{fontFamily:'samsung-one-400'}}>
                                    {/* <Typography variant="subtitle1" > */}
                                        {status.text} 
                                    {/* </Typography> */}
                                </p>
                        </Paper>
                    </div>
                </div>
            ))}
    
        </div>
    )
}


export default timeline;