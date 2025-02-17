import { defaultHistoryType } from '../constants';

function getMicroApp(options) {
    const {
        key, microAppName, cacheName, masterHistoryType, base, namespace, ...normalizedRouteProps
    } = options;
    return `(() => {
const { getMicroAppRouteComponent } = require('@@/${namespace}/getMicroAppRouteComponent');
return getMicroAppRouteComponent({key: '${key}', appName: '${microAppName}', cacheName: '${cacheName}', base: '${base}', masterHistoryType: '${masterHistoryType}', routeProps: ${JSON.stringify(normalizedRouteProps)} })
})()`;
}

function modifyRoutesWithAttachMode({
    routes, masterHistoryType, base, namespace
}) {
    const patchRoutes = (_routes) => {
        if (_routes.length) {
            _routes.forEach((route) => {
                if (route.meta && route.meta.microApp) {
                    route.component = getMicroApp({
                        key: route.path,
                        cacheName: route.meta.cacheName ?? route.path,
                        microAppName: route.meta.microApp,
                        masterHistoryType,
                        base,
                        namespace
                    });
                }
                if (route.children?.length) {
                    modifyRoutesWithAttachMode({
                        routes: route.children,
                        masterHistoryType,
                        base,
                        namespace
                    });
                }
            });
        }
    };

    patchRoutes(routes);

    return routes;
}

export default function modifyRoutes({ api, namespace }) {
    api.modifyRoutes((routes) => {
        const { router, base } = api.config;
        const masterHistoryType = (router && router.mode) || defaultHistoryType;

        modifyRoutesWithAttachMode({
            routes,
            masterHistoryType,
            base: base || '/',
            namespace
        });

        return routes;
    });
}
