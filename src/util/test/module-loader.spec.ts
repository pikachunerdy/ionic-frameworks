import { DeepLinkConfig } from '../../navigation/nav-util';
import { DeepLinker } from '../../navigation/deep-linker';
import { ModuleLoader } from '../module-loader';
import { mockDeepLinkConfig, mockDeepLinker, mockModuleLoader, mockNgModuleLoader } from '../mock-providers';
import { NgModuleLoader } from '../ng-module-loader';


describe('module-loader', () => {

  describe('load', () => {

    it('should call ngModuleLoader and receive a promise back', (done: Function) => {
        spyOn(ngModuleLoader, 'load').and.returnValue(Promise.resolve());

        const knownPathPrefix = '../some/known/path';
        const knownExportSuffix = 'SomeModule';
        const loadChildrenValue = knownPathPrefix + '#' + knownExportSuffix;

        const promise = moduleLoader.load(loadChildrenValue);

        promise.then((response) => {
          expect(ngModuleLoader.load).toHaveBeenCalledWith(knownPathPrefix, knownExportSuffix);
        }).catch((err: Error) => {
          done(err);
        });
    });

    it('should only call the ngModuleLoader when there is not an active request', () => {
        let resolve: any = null;
        let reject: any = null;
        let promise = new Promise((scopedResolved, scopedReject) => {
            resolve = scopedResolved;
            reject = scopedReject;
        });

        spyOn(ngModuleLoader, 'load').and.returnValue(promise);

        const knownPathPrefix = '../some/known/path';
        const knownExportSuffix = 'SomeModule';
        const loadChildrenValue = knownPathPrefix + '#' + knownExportSuffix;

        promise = moduleLoader.load(loadChildrenValue);

        // the promise is not resolved
        let secondPromise = moduleLoader.load(loadChildrenValue);

        // we would expect the same promise to be returned both times
        expect(promise).toEqual(secondPromise);

        // TODO enable this with caching
        // expect(ngModuleLoader.load).toHaveBeenCalledTimes(1);
    });

  });

  var deepLinker: DeepLinker;
  var deepLinkConfig: DeepLinkConfig;
  var moduleLoader: ModuleLoader;
  var ngModuleLoader: NgModuleLoader;

  beforeEach(() => {
    deepLinkConfig = mockDeepLinkConfig();
    deepLinker = mockDeepLinker(deepLinkConfig);
    ngModuleLoader = mockNgModuleLoader();

    moduleLoader = mockModuleLoader(ngModuleLoader);
  });

});
