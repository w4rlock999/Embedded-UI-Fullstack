import React from 'react';

const mappingDialog1 = (
    <DialogContent>
        <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Save To"
        type="email"
        fullWidth
        />
        <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Project Name"
        type="email"
        fullWidth
        />
        <FormGroup column>
        <FormControlLabel
            control={
            <Checkbox
                // checked={this.state.checkedA}
                // onChange={this.handleChange('checkedA')}
                value="true"
            />
            }
            label="Record .bag"
        />
        <FormControlLabel
            control={
            <Checkbox
                // checked={this.state.checkedA}
                // onChange={this.handleChange('checkedA')}
                value="true"
            />
            }
            label="Real-Time Mapping"
        />
        </FormGroup>
    </DialogContent>               
);

const mappingDialog2 = (
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="On-Site Azimuth"
        type="email"
        fullWidth
      />
    </DialogContent>
);

function dialogContentRender(dialogPhase) {
    // const dialogPhase = props.dialogPhase;
    
    if (!dialogPhase) {
      return mappingDialog1;
    } else {
      return mappingDialog2;
    }  
}; 
