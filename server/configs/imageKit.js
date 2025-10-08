import ImageKit from "@imagekit/nodejs";

const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Compatibility wrappers: different SDK versions expose upload helpers differently.
const upload = async (options = {}) => {
  // try common locations for upload function
  if (typeof ik.upload === 'function') return ik.upload(options);
  if (ik.files && typeof ik.files.upload === 'function') return ik.files.upload(options);
  if (ik.uploads && typeof ik.uploads.upload === 'function') return ik.uploads.upload(options);
  if (ik.uploader && typeof ik.uploader.upload === 'function') return ik.uploader.upload(options);
  // last-resort: try calling the instance as function (unlikely)
  if (typeof ik === 'function') return ik(options);
  throw new Error('No upload method available on ImageKit instance.');
};

const helper = {
  buildSrc: (options = {}) => {
    if (ik.helper && typeof ik.helper.buildSrc === 'function') return ik.helper.buildSrc(options);
    if (typeof ik.url === 'function') return ik.url(options);
    // fallback: if helper not present, return urlEndpoint + path
    if (ik.options && ik.options.urlEndpoint && options.path) {
      // ensure no duplicate slashes
      return `${ik.options.urlEndpoint.replace(/\/$/, '')}/${options.path.replace(/^\//, '')}`;
    }
    throw new Error('No URL builder available on ImageKit instance.');
  }
};

// Export a normalized object that controllers can rely on
const imagekit = {
  instance: ik,
  upload,
  helper,
};

export default imagekit;