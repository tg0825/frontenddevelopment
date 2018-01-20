// naver.view.OrganizationTree.js
/**
 * @param {string} sSelector
 * @param {naver.collection.Organizations} oCollection
 * @constructor
 */
naver.view.OrganizationTree = function (sSelector, oCollection) {
    this._sSelector = sSelector;
    this.oCollection = oCollection;

    this._assignElements();
    this._bindEvents();
    this.render();
};

naver.view.OrganizationTree.prototype = {
    /**
     * 이벤트를 바인드한다.
     * @private
     */
    _bindEvents: function () {
        this.welTreeSet.on('click', 'a.link', $.proxy(this._onClickSelectOrganization, this));
        this.welTreeSet.on('click', 'a.link', $.proxy(this._onClickOpenCloseOrganization, this));
    },

    /**
     * 조직 click 이벤트 리스너, 선택 모드로 전환한다.
     * @param {MouseEvent} MouseEvent
     * @private
     */
    _onClickOpenCloseOrganization: function (oEvent) {
        var nId = $(oEvent.currentTarget).data('organization-id');
        var welOrganization = this.getElementNodeById(nId);
        var welChildrenList = this.getElementListById(nId);
        var welButton = welOrganization.siblings('button');

        if (this.oCollection.find(nId).hasChildren()) {
            welOrganization.toggleClass('opened_child');
            welChildrenList.toggleClass('opened');
            welButton.html('폴더 열기');

            if (welOrganization.hasClass('opened_child')) {
                welButton.html('폴더 닫기');
            }
        }
    },

    /**
     * 조직 요소를 찾아서 반환한다.
     * @param {number} nId
     * @returns {jQuery}
     */
    getElementNodeById: function (nId) {
        return this.welTreeSet.find('a[data-organization-id=' + nId + ']');
    },

    /**
     * 하위 리스트 요소를 찾아서 반환한다.
     * @param {number} nId
     * @returns {jQuery}
     */
    getElementListById: function (nId) {
        var welOrganization = this.getElementNodeById(nId);
        var welChildrenList = welOrganization.siblings('ul');

        if (this.oCollection.find(nId).isRoot()) {
            welChildrenList = welOrganization.parents('h4').siblings('ul');
        }

        return welChildrenList;
    },

    /**
     * 조직 click 이벤트 리스너, 선택 모드로 전환한다.
     * @param {MouseEvent} oEvent
     * @private
     */
    _onClickSelectOrganization: function (oEvent) {
        var welOrganization = $(oEvent.currentTarget);

        this.welOrganizations.find('a.link').removeClass('selected');
        welOrganization.addClass('selected');
    },

    /**
     * 조직도 트리를 렌더링한다.
     */
    render: function () {
        this._renderRootOrganization();
        this._renderPlainOrganization();
    },

    /**
     * 최상위 조직을 렌더링 한다.
     * @private
     */
    _renderRootOrganization: function () {
        this.welTreeSet.html(this._tmplRootNode({
            company: this.oCollection.find(this.oCollection.COMPANY_NODE),
            unspecified: this.oCollection.find(this.oCollection.UNSPECIFIED_NODE)
        }));
    },

    /**
     * 그 외 조직을 렌더링한다.
     * @private
     */
    _renderPlainOrganization: function () {
        var oSelf = this;
        var welList = this.welTreeSet.find('ul.list');

        this.oCollection.each(function (oOrganization) {
            if(!oOrganization.isRoot()) {
                var welParent = welList.find('a[data-organization-id=' + oOrganization.nParentId + ']');
                var welOrganization = $(oSelf._tmplPlainNode({
                    organization: oOrganization
                }));

                if (welParent.length === 0) {
                    welList.append(welOrganization);
                } else {
                    welParent.siblings('ul').append(welOrganization);
                }
            }
        });
    },

    /**
     * 요소를 할당한다.
     * @private
     */
    _assignElements: function () {
        this.welOrganizations = $(this._sSelector);
        this.welTitleSet = this.welOrganizations.children('.title_set');
        this.welTreeSet = this.welOrganizations.children('.tree_set');
        this._tmplRootNode = _.template($('#tmpl_root_node')[0].innerHTML);
        this._tmplPlainNode = _.template($('#tmpl_plain_node')[0].innerHTML);
    }
};
