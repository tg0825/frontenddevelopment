// naver.view.OrganizationTreeContextMenu.js
/**
 * @param {naver.view.OrganizationTree} oOrganizationTree
 * @constructor
 */

naver.view.OrganizationTreeContextMenu = function (oOrganizationTree) {
    this._oOrganizationTree = oOrganizationTree;
    this.oCollection = this._oOrganizationTree.oCollection;
    this.welOrganizations = this._oOrganizationTree.welOrganizations;
    this.welTreeSet = this._oOrganizationTree.welTreeSet;
    this.welTitleSet = this._oOrganizationTree.welTitleSet;
    this._isShowingMenu = false;

    this._bindEvents();
};

naver.view.OrganizationTreeContextMenu.prototype = {
    /**
     * 조직도 트리를 렌더링한다.
     */
    render: function () {
        this._oOrganizationTree.render();
    },

    /**
     * 조직 요소를 찾아서 반환한다.
     * @param {number} nId
     * @returns {jQuery}
     */
    getElementNodeById: function (nId) {
        return this._oOrganizationTree.getElementNodeById(nId);
    },

    /**
     * 하위 리스트 요소를 찾아서 반환한다.
     * @param {number} nId
     * @returns {jQuery}
     */
    getElementListById: function (nId) {
        return this._oOrganizationTree.getElementListById(nId);
    },

    /**
     * 현재 선택된 노드에 새 조직을 생성한다.
     * 생성 후 이름을 변경할 수 있게 편집 모드로 전환한다.
     */
    createNode: function () {
        this._oOrganizationTree.createNode();
    },

    /**
     * ID에 해당하는 조직의 이름을 변경할 수 있게 상태를 변경한다.
     * @param {number} nId
     */
    renameNode: function (nId) {
        this._oOrganizationTree.renameNode(nId);
    },

    /**
     * 조직을 삭제한다
     * @param {number} nId
     */
    removeNode: function (nId) {
        this._oOrganizationTree.removeNode(nId);
    },

    /**
     * 이벤트를 바인드한다.
     * @private
     */
    _bindEvents: function () {
        this.welTreeSet.on('contextmenu', 'a.link', $.proxy(this._onContenxtMenuOrganization, this));
        this.welOrganizations.children('.context_menu').on('click', 'button', $.proxy(this._onClickContentMenuButton, this));
        $(document).on('click', $.proxy(this._onClickDocument, this));
    },

    /**
     * 콘텍스트 메뉴 이벤트 리스너
     * @param {MouseEvent} oEvent
     * @private
     */
    _onContenxtMenuOrganization: function (oEvent) {
        oEvent.preventDefault();

        var welTargetOrganization = $(oEvent.currentTarget);
        var nId = welTargetOrganization.data('organization-id');
        var htOffset = this.welOrganizations.offset();

        if (!this.oCollection.find(nId).isRoot()) {
            this._welTargetOrganization = $(oEvent.currentTarget);
            this._isShowingMenu = true;

            this.welOrganizations.children('.context_menu').show().css({
                top: oEvent.clientY - htOffset.top,
                left: oEvent.clientX - htOffset.left
            });
        }
    },

    /**
     * 도큐먼트 click 이벤트 리스너, 콘텍스트 메뉼르 감춘다.
     * @private
     */
    _onClickDocument: function () {
        if (this._isShowingMenu) {
            this._isShowingMenu = false;
            this.welOrganizations.children('.context_menu').hide();
        }
    },

    /**
     * 콘텍스트 메뉴 버튼 click 이벤트 리스너
     * @param {MouseEvent} oEvent
     * @private
     */
    _onClickContentMenuButton: function (oEvent) {
        var welMenuButton = $(oEvent.currentTarget);
        var nTargetId = this._welTargetOrganization.data('organization-id');

        if (welMenuButton.hasClass('change')) {
            this.renameNode(nTargetId);
        } else {
            this.removeNode(nTargetId);
        }
    }
};
