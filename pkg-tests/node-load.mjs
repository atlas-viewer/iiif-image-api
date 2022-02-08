import { ImageServiceLoader } from '@atlas-viewer/iiif-image-api';

const loader = new ImageServiceLoader();
loader.loadService({ id: 'https://iiif.wellcomecollection.org/image/b18035723_0001.JP2' }).then((r) => {
  console.log(r);
});
