import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Collections } from '/imports/lib/core.js';

const meta404 = {
  robots: 'noindex, nofollow',
  title: '404: Page not found',
  keywords: {
    name: 'keywords',
    itemprop: 'keywords',
    content: '404, page, not found'
  },
  description: {
    name: 'description',
    itemprop: 'description',
    property: 'og:description',
    content: '404: No such page'
  },
  'twitter:description': '404: No such page',
  'og:image': {
    property: 'og:image',
    content: Meteor.absoluteUrl('social-1280x640.png')
  },
  'twitter:image': {
    name: 'twitter:image',
    content: Meteor.absoluteUrl('social-1280x640.png')
  }
};

const promiseMethod = (name, args, sharedObj, key) => {
  return new Promise((resolve) => {
    Meteor.apply(name, args, (error, result) => {
      if (error) {
        console.error(`[promiseMethod] [${name}]`, error);
        sharedObj[key] = void 0;
      } else {
        sharedObj[key] = result || void 0;
      }
      resolve();
    });
  });
};

// ASK FLOWROUTER TO WAIT AND PULL ALL DYNAMIC DEPENDENCIES
// BEFORE INITIALIZING ROUTER
FlowRouter.wait();
Promise.all([
  import('/imports/client/loading/loading.jade'),
  import('/imports/client/styles/core.sass'),
  import('/imports/client/line-awesome.css'),
  import('/imports/client/layout/layout.js')
]).then(() => {
  FlowRouter.initialize();
}).catch((e) => {
  console.error('[Promise.all] loading dynamic imports error:', e);
});

FlowRouter.route('/', {
  name: 'index',
  action() {
    this.render('layout', 'index');
  },
  waitOn() {
    return import('/imports/client/index/index.js');
  },
  whileWaiting() {
    this.render('layout', 'loading');
  }
});

FlowRouter.route('/about', {
  name: 'about',
  title: 'About',
  meta: {
    keywords: {
      name: 'keywords',
      itemprop: 'keywords',
      content: 'about, file, files, share, sharing, upload, service, free, details'
    },
    description: {
      name: 'description',
      itemprop: 'description',
      property: 'og:description',
      content: 'About file-sharing web application'
    },
    'twitter:description': 'About file-sharing web application'
  },
  action() {
    this.render('layout', 'about');
  },
  waitOn() {
    return import('/imports/client/about/about.js');
  },
  whileWaiting() {
    this.render('layout', 'loading');
  }
});

FlowRouter.route('/settings', {
  name: 'settings',
  title: 'Settings',
  meta: {
    robots: 'noindex, nofollow',
    keywords: {
      name: 'keywords',
      itemprop: 'keywords',
      content: 'settings, options, configuration, file, upload, share, sharing'
    },
    description: {
      name: 'description',
      itemprop: 'description',
      property: 'og:description',
      content: 'File upload and sharing settings'
    },
    'twitter:description': 'File upload and sharing settings'
  },
  action() {
    this.render('layout', 'settings');
  },
  waitOn() {
    return import('/imports/client/settings/settings.js');
  },
  whileWaiting() {
    this.render('layout', 'loading');
  }
});

FlowRouter.route('/f/:_id', {
  name: 'file',
  title(params, queryParams, file) {
    if (file) {
      return 'Download shared file';
    }
    return meta404.title;
  },
  meta(params, queryParams, _file) {
    if (_file) {
      const file = _file.get();
      return {
        robots: 'noindex, nofollow',
        keywords: {
          name: 'keywords',
          itemprop: 'keywords',
          content: 'secure, file, download, shared, share'
        },
        description: {
          name: 'description',
          itemprop: 'description',
          property: 'og:description',
          content: 'Download shared file before its expiration'
        },
        'og:image': {
          property: 'og:image',
          content: Meteor.absoluteUrl('file-1280x640.png')
        },
        'twitter:description': 'Download shared file',
        'twitter:image': {
          name: 'twitter:image',
          content: Meteor.absoluteUrl('file-1280x640.png')
        }
      };
    }

    return meta404;
  },
  link: {
    image: {
      itemprop: 'image',
      content: Meteor.absoluteUrl('file-1280x640.png'),
      href: Meteor.absoluteUrl('file-1280x640.png')
    }
  },
  action(params) {
    this.render('layout', 'file', { params });
  },
  waitOn(params) {
    const waitFor = [import('/imports/client/file/file.js')];
    if (!Collections.files.findOne(params._id)) {
      waitFor.push(promiseMethod('file.get', [params._id], this.conf, 'file'));
    }

    return waitFor;
  },
  whileWaiting() {
    this.render('layout', 'loading');
  },
  onNoData() {
    // SHOW "loading" TEMPLATE
    this.render('layout', 'loading');
    // PULL 404 TEMPLATE AND ITS CONTROLLER "PROGRESSIVELY" FROM SERVER
    import('/imports/client/_404/_404.js').then(() => {
      // RENDER 404 TEMPLATE AFTER IT'S FULLY LOADED ON THE CLIENT
      this.render('layout', '_404');
    });
  },
  data(params) {
    // CHECK IF FILE EXISTS IN LOCAL STORAGE
    const file = Collections.files.findOne(params._id);
    if (file) {
      return file;
    }

    // CHECK IF FILE EXISTS ON SERVER
    if (this.conf.file) {
      // INSERT RECORD TO LOCAL COLLECTION
      // WHICH WOULD STORE RECORD IN THE PERSISTENT STORAGE
      Collections._files.insert(this.conf.file);

      // GET *FileCursor* FROM *FilesCollection*
      // WITH REACTIVITY AND METHODS LIKE `.link()`
      return Collections.files.findOne(this.conf.file._id);
    }

    // TRIGGER 404 PAGE
    return void 0;
  }
});

// 404 route (catch all)
FlowRouter.route('*', {
  title: '404: Page not found',
  meta: meta404,
  action() {
    this.render('layout', '_404');
  },
  waitOn() {
    return import('/imports/client/_404/_404.js');
  },
  whileWaiting() {
    this.render('layout', 'loading');
  }
});
