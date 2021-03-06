import {inject, LogManager} from 'aurelia-framework';
import {activationStrategy, Router} from 'aurelia-router';
import * as toastr from "toastr";

import {Api} from '../resources/api';


import {Prompt} from '../components/dialogs/prompt';
import {DialogService} from 'aurelia-dialog';

let logger = LogManager.getLogger('edit');

@inject(Api, DialogService, Router)
export class Edit {

    evidenceId = null;
    evidence = {};
    metadata = {
      'evidence_notes': '', 'evidence_status': '', 'author': '',
      'creation_date': '', 'reviewer': '', 'review_date': '',
      'evidence_source': ''};
    submitEvidence = {};  // add back the top-level 'evidence' key, value prior to submission
    annotations = [];

  // Needed to allow New BEL menu item to refresh the form
  determineActivationStrategy() {
    return activationStrategy.replace;
  }

  constructor(Api, DialogService, Router) {
    this.api = Api;
    this.dialogService = DialogService;
    this.router = Router;
  }

  activate(params) {

    if (params.id) {
      logger.debug('ID: ', params.id);
      this.evidenceId = params.id;

      // Return Promise in activate to wait until all data is collected before building
      //   the page
      return this.api.getBelEvidence(this.evidenceId)
        .then(evidence => {
          this.evidence = evidence;
          this.extractFormMetadata(); // depends on this.metadata and this.evidence
          return this.api.getBelComponents(this.evidence.bel_statement);
        })
        .then(comp => {
          this.belsubject = comp.subject;
          this.belobject = comp.object;
          this.belrelationship = comp.relationship;
          logger.debug('Subj: ', this.belsubject);
          return this.api.getBelAnnotationTypes();
        })
        .then(types => {
          this.types = types;
          logger.debug('AnnotationTypes: ', this.types);
        })
        .catch(reason => {
          logger.error('Process BEL Evidence Error: ', reason);
        });
    }
    else {
      return this.api.getBelAnnotationTypes()
            .then(types => {
              this.types = types;
              logger.debug('AnnotationTypes: ', this.types);
            })
            .catch(function(reason) {
              logger.error(`GET Annotation Types: ${reason}`);
            });
    }
  }


  belsubjectChanged() {
    logger.debug('Main BEL Subject changed: ', this.belsubject);
  }
  /**
   * Force the evidence object to be recreated for force an update of the nested
   * object binding in the View
   */
  refreshEvidenceObjBinding () {
    let temp = this.evidence;
    this.evidence = {};
    this.evidence = temp;
  }

  prepareEvidence() {
    let submitEvidence = {};
    // Prepare BEL Statement
    this.evidence.bel_statement = `${this.belsubject} ${this.belrelationship} ${this.belobject}`;

    // Remove blank entries in evidence.experiment_context
    logger.debug('Cleaning evidence -- context items');
    this.evidence.experiment_context = this.evidence.experiment_context.filter(obj => obj.value);

    // Add to Metadata
    this.addFormMetadata();

    submitEvidence = {'evidence': this.evidence};
    return submitEvidence;
  }

  // Add to evidence Metadata
  //   Note - this is only for adding strings
  //   TODO - support adding objects as values
  addFormMetadata() {
    if (this.evidence.metadata) {
      for (let key in this.metadata) {
        let idx = this.evidence.metadata.findIndex(obj => obj.name === key);
        if (idx >= 0) {
          this.evidence.metadata[idx].value += this.metadata.key;
        } else {
          this.evidence.metadata.push(
            {
              'name' : key,
              'value': this.metadata[key]
            });
        }
      }
    }
  }

  extractFormMetadata() {
    for (let k in this.metadata) {
      let idx = this.evidence.metadata.findIndex(obj => obj.name === k);
      if (idx >= 0) {
        this.metadata[k] = this.evidence.metadata[idx].value;
      }
    }
  }

  /**
   * Submit BEL Evidence to API
   * @returns {boolean}
   */

  // // TODO test this
  // submit() {
  //   let prompt = 'This will update the Evidence!';
  //   this.dialogService.open({ viewModel: Prompt, model: prompt}).then(response => {
  //     if (!response.wasCancelled) {
  //       logger.debug('approvedPrompt');
  //       this.submitUpdate;
  //     } else {
  //       logger.debug('cancelledPrompt');
  //     }
  //     logger.debug(response.output);
  //   });
  //   return true;
  // }

  // TODO  Add notification of successful update or new evidence
  submitUpdate() {
    logger.debug('Prior to prepare update evidence', JSON.stringify(this.evidence, null, 2));
    let submitEvidence = this.prepareEvidence();
    logger.debug('Update evidence', JSON.stringify(submitEvidence, null, 2));
    this.api.loadBelEvidence(submitEvidence, this.evidenceId)
    .then(response => {
      toastr.success('', 'Updated Evidence');
    })
    .catch(function(reason) {
      toastr.options = {"timeOut": "15000"};
      toastr.error('', 'Cannot update Evidence');
      toastr.options = {"timeOut": "5000"};
      logger.error('Problem updating Evidence ', reason);
    });

    return true;
  }

  submitNew() {
    logger.debug('Prior to prepare new evidence', JSON.stringify(this.evidence, null, 2));
    let submitEvidence = this.prepareEvidence();
    logger.debug('Submit new evidence', JSON.stringify(submitEvidence, null, 2));

    this.api.loadBelEvidence(submitEvidence)
    .then(response => {
      return response.headers.get('Location');
    })
    .then(location => {
      logger.debug('Loc: ', location);
      let evidenceId = this.api.getIdFromUrl(location);
      logger.debug('Router: ', this.router);
      toastr.success('', 'Created New Evidence');
      this.router.navigateToRoute('edit', { id: evidenceId });
    })
    .catch(function(reason) {
      toastr.options = {"timeOut": "15000"};
      toastr.error('', 'Cannot create new Evidence');
      toastr.options = {"timeOut": "5000"};
      logger.error('Problem creating Evidence ', reason);
    });

    return true;
  }

}
