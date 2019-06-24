import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import './timeline.css';
import Typography from '@material-ui/core/Typography';

// const styles = theme => ({
//     root: {
//       ...theme.mixins.gutters(),
//       paddingTop: theme.spacing.unit * 2,
//       paddingBottom: theme.spacing.unit * 2,
//     },
//   });



function timeline(props) {

    // const { classes } = props;
    const statusPushed = props.statusPushed;

    return (
        
        <div className="baseContainer">
            {/* <div className="timeline">
                <div className="content">
                    <Paper className={classes.root} elevation={1}>                
                    </Paper>
                </div>
            </div> */}

            <div className="timeline"></div>


             {statusPushed.map(status => (
                <div className="paperContainer" >
                    <Paper className="paper" elevation={1}>
                            <p className="timeline-text">
                                <Typography variant="subtitle1" >
                                    {status.text} 
                                </Typography>
                            </p>
                    </Paper>
                </div>
            ))}   
            
        </div>
    )
}


export default timeline;