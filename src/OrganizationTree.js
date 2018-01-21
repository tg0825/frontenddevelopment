// organizationTree.js

/**
 * @author tg0825
 * @version 0.0.1
 * @copyright MIT
 * @global
 * @param {Object} htOptions
 * @param {number} htOptions.sApiUrl 조직 리스트를 요청, 추가, 변경, 삭제 할 수 있는 HTTP API 주소
 * @param {string} htOptions.sSelector 조직도 트리 뷰 선택자
 * @param {boolean} htOptions.useContextMenu 콘텍스트 ㅔㅁ뉴 사용 여부
 * @return {naver.view.OrganizationTree | naver.view.OrganizationTreeContextMenu}
 * @example
 * var oOrganization = organizationTree({
 * sAPiUrl: '/api/organizations',
 * sSelector: '.snb_organization',
 * useContextMenu: true
 * });
 */
var organizationTree = function (htOptions) {
    var oOrganizations = new naver.collection.Organizations(htOptions.sApiUrl);
    var oOrganizationTree = new naver.view.OrganizationTree(htOptions.sSelector, oOrganizations);

    if (htOptions.useContextMenu) {
        oOrganizationTree = new naver.view.OrganizationTreeContextMenu(oOrganizationTree);
    }

    return oOrganizationTree;
};
