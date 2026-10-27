// Configure the decoder before importing the component, which upgrades existing models.
const decoderLocation = new URL('./', import.meta.url).href;
globalThis.ModelViewerElement = {
  ...globalThis.ModelViewerElement,
  dracoDecoderLocation: decoderLocation
};
const {ModelViewerElement} = await import('./model-viewer.min.js');
ModelViewerElement.dracoDecoderLocation = decoderLocation;
