define([
  'vb/action/actionChain',
  'vb/action/actions',
  'vb/action/actionUtils',
], (
  ActionChain,
  Actions,
  ActionUtils
) => {
  'use strict';

  class FilePickerSelectChain extends ActionChain {

    /**
     * @param {Object} context
     * @param {Object} params
     * @param {object[]} params.files 
     */
    async run(context, { files }) {
      const { $page, $flow, $application } = context;

      $page.variables.holdImage = files[0];

      $page.variables.imageURL = URL.createObjectURL($page.variables.holdImage);

      const uploadFileResult = await Actions.callRest(context, {
        endpoint: 'objectstorageEuFrankfurt1OraclecloudCom/putNNamespaceNameBBucketNameOObjectName',
        uriParams: {
          bucketName: $page.variables.bucketName,
          namespaceName: $page.variables.namespaceName,
          objectName: $page.variables.holdImage.name,
        },
        body: $page.variables.holdImage,
        contentType: $page.variables.holdImage.type,
      });

      if (!uploadFileResult.ok) {
        await Actions.fireNotificationEvent(context, {
          summary: "File upload files with code: " + uploadFileResult.body.code,
          message: uploadFileResult.body.message,
        });
      
        return;
      } else {
        const createDocumentProcessorJobResult = await Actions.callRest(context, {
          endpoint: 'documentAiserviceEuFrankfurt1OciOraclecloudCom/post20221109',
          body: {
            processorConfig: {
              processorType: $page.variables.processType,
              features: [
                {
                  featureType: $page.variables.featureType,
                },
                {
                  featureType: $page.variables.featureType2,
                  maxResults: 1,
                },
              ],
            },
            inputLocation: {
              sourceType: 'OBJECT_STORAGE_LOCATIONS',
              objectLocations: [
                {
                  bucketName: $page.variables.bucketName,
                  namespaceName: $page.variables.namespaceName,
                  objectName: $page.variables.holdImage.name,
                },
              ],
            },
            outputLocation: {
              bucketName: $page.variables.bucketName,
              namespaceName: $page.variables.namespaceName,
              prefix: 'result',
            },
            compartmentId: $page.variables.compartmentId,
          },
        });

        if (!createDocumentProcessorJobResult.ok) {
          await Actions.fireNotificationEvent(context, {
            summary: "Create proccessor job error: " + createDocumentProcessorJobResult.body.code,
            message: createDocumentProcessorJobResult.body.message,
          });
        
          return;
        } else {
          const getResultObjectResults = await Actions.callRest(context, {
            endpoint: 'objectstorageEuFrankfurt1OraclecloudCom/getJobResultsObject',
            uriParams: {
              bucketName: $page.variables.bucketName,
              'namespace_bucket': $page.variables.namespaceName + "_" + $page.variables.bucketName,
              fileName: $page.variables.holdImage.name + ".json",
              namespaceName: $page.variables.namespaceName,
              jobId: createDocumentProcessorJobResult.body.id,
            },
          });

          if (!getResultObjectResults.ok) {
            await Actions.fireNotificationEvent(context, {
              summary: "cannot retrieve results with error code:" + getResultObjectResults.body.code,
              message: getResultObjectResults.body.message,
            });
          
            return;
          } else {
            $page.variables.firstName = getResultObjectResults.body.pages[0].documentFields[0].fieldValue.value;

            $page.variables.LastName = getResultObjectResults.body.pages[0].documentFields[1].fieldValue.value;

            $page.variables.country = getResultObjectResults.body.pages[0].documentFields[2].fieldValue.value;

            $page.variables.nationality = getResultObjectResults.body.pages[0].documentFields[3].fieldValue.value;

            $page.variables.birthDate = getResultObjectResults.body.pages[0].documentFields[4].fieldValue.value;

            $page.variables.expiryDate = getResultObjectResults.body.pages[0].documentFields[5].fieldValue.value;

            $page.variables.gender = getResultObjectResults.body.pages[0].documentFields[6].fieldValue.value;

            $page.variables.documentType = getResultObjectResults.body.pages[0].documentFields[7].fieldValue.value;

            $page.variables.documentNumber = getResultObjectResults.body.pages[0].documentFields[8].fieldValue.value;
          }
        }
      }
    }
  }

  return FilePickerSelectChain;
});
