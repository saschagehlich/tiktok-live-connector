/**
 * This ugly function brings the nested protobuf objects to a flat level
 * In addition, attributes in "Long" format are converted to strings (e.g. UserIds)
 * This makes it easier to handle the data later, since some libraries have problems to serialize this protobuf specific data.
 */
export function simplifyObject(webcastObject: any): any;
export function getUserAttributes(webcastUser: any): {
    userId: any;
    secUid: any;
    uniqueId: any;
    nickname: any;
    profilePictureUrl: any;
    followRole: any;
    userBadges: any[];
    userSceneTypes: any;
    userDetails: {
        createTime: any;
        bioDescription: any;
        profilePictureUrls: any;
    };
};
//# sourceMappingURL=webcastDataConverter.d.ts.map