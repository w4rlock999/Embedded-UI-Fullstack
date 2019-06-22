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

    const { classes } = props;

    const style2 = {
        height: 150,
        width: 150,
        paddingLeft: 500,
    }

    return (
        
        <div>
            {/* <div className="timeline">
                <div className="content">
                    <Paper className={classes.root} elevation={1}>                
                    </Paper>
                </div>
            </div> */}

            <div className="paperdiv">
                <Paper className="paper" elevation={1}>
                        {/* heyheyhye */}
                        <p className="timeline-text">
                            <Typography variant="subtitle1" >
                                Status 
                            </Typography>
                        </p>
                </Paper>
        
            </div>
            
            <div className="paperdiv">
                <Paper className="paper" elevation={1}>
                        {/* heyheyhye2 */}
                </Paper>
            </div>
            
        </div>

    )
}


export default timeline;