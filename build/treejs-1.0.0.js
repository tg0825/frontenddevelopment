// namespace.js
if (!naver) {
    /**
     * @namespace
     */
     var naver = {};
}

/**
 * @namespace
 */
naver.model = naver.modal || {};

/**
 * @namespace
 */
naver.collection = naver.collection || {};

/**
 * @namespace
 */
naver.view = naver.view || {};

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

// naver.collection.Organizations.js
/**
 * @param {string} sApiUrl 조직도 API 주소
 * @constructor
 */
naver.collection.Organizations = function (sApiUrl) {
    this._sApiUrl = sApiUrl;
    this._aComposite = [];
    this._requestOrganizations();
};

naver.collection.Organizations.prototype = {
    /**
     * 최상위 회사 조직 ID
     * @type {number}
     */
    COMPANY_NODE: 0,

    /**
     * 최상위 조직미지정 ID
     */
    UNSPECIFIED_NODE: 1,
    
    /**
     * 조직을 삭제한다.
     * @param {number} nId
     * @returns {jQuery.Deferred}
     */
    remove: function (nId) {
        var oSelf = this;

        return $.ajax({
            url: this._sApiUrl + '/' + nId,
            type: 'DELETE'
        }).then(function (htRemoved) {
            var oOrganization = oSelf.find(htRemoved.id);
            var oParent = oSelf.find(oOrganization.nParentId);

            oParent.removeChild(oOrganization);
        });
    },

    /**
     * 조직의 이름을 변경한다.
     * @param {number} nId
     * @param {string} sName
     */
    rename: function (nId, sName) {
        var oSelf = this;

        return $.ajax({
            url: this._sApiUrl + '/' + nId + '?name=' + sName,
            type: 'PUT',
        }).then(function (htDataSet) {
            var oOrganization = oSelf.find(htDataSet.id);
            oOrganization.sName = htDataSet.name;

            return oOrganization;
        });
    },

    /**
     * 지정한 조직의 새로운 하위 조직을 생성한다.
     * @param {number} nId
     * @returns {jQuery.Deferred}
     */
    create: function (nId) {
        var oSelf = this;

        return $.ajax({
            url: this._sApiUrl + '/' + nId,
            type: 'post',
        }).then(function (htDataSet) {
            var oOrganization = new naver.model.Organization(htDataSet);
            var oParent = oSelf.find(oOrganization.nParentId);

            oParent.appendChild(oOrganization);
            return oOrganization;
        });
    },

    /**
     * 조직을 처음부터 마지막까지 순회한다.
     * @param {function} fnCallback
     */
    each: function (fnCallback) {
        var oSelf = this;

        _.each(this._aComposite, function (oOrganization) {
            oSelf._traverse(oOrganization, undefined, fnCallback);
        });
    },

    /**
     * id값과 같은 조직을 찾아서 반환한다.
     * @param {number} nTargetId
     * @returns {naver.model.Organization}
     */
    find: function (nTargetId) {
        var oSelf = this;
        var oResult = null;

        _.every(this._aComposite, function (oOrganization) {
            oResult = oSelf._traverse(oOrganization, nTargetId);
            return !oResult;
        });

        return oResult;
    },

    /**
     * 전달받은 조직의 하위 조직을 재귀적으로 순회한다.
     * @param {naver.model.Organization} oOrganization
     * @param {number|undefined} nTargetId
     * @param {function?} fnCallback
     * @returns {null|naver.model.Organization}
     * @private
     */
    _traverse: function (oOrganization, nTargetId, fnCallback) {
        var aChildren = oOrganization.getChildren();
        var oResult = null;
        var oSelf = this;

        if (typeof fnCallback === 'function') {
            fnCallback(oOrganization);
        }

        if (oOrganization.nId === nTargetId) {
            return oOrganization;
        }

        _.every(aChildren, function (oChild) {
            oResult = oSelf._traverse(oChild, nTargetId, fnCallback);
            return !oResult;
        });

        return oResult;
    },

    /**
     * 조직을 트리 구조로 조합한다.
     * @param {Array.<naver.model.Organization>} aOrganizations
     * @private
     */
    _composeOrganizations: function (aOrganizations) {
        var oParent = null;
        var oSelf = this;

        _.each(aOrganizations, function (oOrganization) {
            if (oOrganization.isRoot()) {
                oSelf._aComposite.push(oOrganization);
            } else {
                oParent = _.findWhere(aOrganizations, {nId: oOrganization.nParentId});
                oParent.appendChild(oOrganization);
            }
        });
    },

    /**
     * 조직 리스트를 객체화한다.
     * @param {Array.<OrganizationDataSet>} aListData
     * @returns {Array}
     * @private
     */
    _createOrganizations: function (aListData) {
        var aOrganizations = [];
        _.each(aListData, function (htDataSet) {
            aOrganizations.push(new naver.model.Organization(htDataSet));
        });

        return aOrganizations;
    },

    /**
     * 조직 리스트를 요청한다.
     * @private
     */
    _requestOrganizations: function () {
        // var oSelf = this;

        $.ajax({
            url: this._sApiUrl,
            async: false,
        }).then($.proxy(this._createOrganizations, this))
        .then($.proxy(this._composeOrganizations, this));
    }
};

// naver.modal.Organization.js
/**
 * @typedef {Object} OrganizationDataSet
 * @property {number} id 조직의 ID
 * @property {String} name 조직의 이름
 * @property {number} parentId 조직의 상위 조직의 ID
 * @property {number} depth 조직의 깊이값
 */

/**
 * @param {OrganizationDataSet} htDataSet
 * @constructor
 */
naver.model.Organization = function (htDataSet) {
    this.nId = htDataSet.id;
    this.sName = htDataSet.name;
    this.nParentId = htDataSet.parentId;
    this.nDepth = htDataSet.depth;

    this._aChildren = [];
};

naver.model.Organization.prototype = {
    /**
    * 하위 조직 리스트를 반환한다.
    * @returns {Array.<naver.model.Organization>}
    */
    getChildren: function () {
        return this._aChildren;
    },

    /**
    * 하위 조직을 추가한다.
    * @param {naver.model.Organization} oOrganization
    */
    appendChild: function (oOrganization) {
        this._aChildren.push(oOrganization);
    },

    /**
    * 자식 노드가 있는지 판단한다.
    * @returns {boolean}
    */
    hasChildren: function () {
        return this._aChildren.length > 0;
    },

    /**
     * 최상위 조직인지 판단한다.
     * @returns {boolean}
     */
    isRoot: function () {
        return this.nParentId === -1;
    },

    /**
     * 하위 조직을 삭제한다.
     * @param {naver.model.Organization} oOrganization
     */
    removeChild: function (oOrganization) {
        this._aChildren = _.without(this._aChildren, oOrganization);
    },
};

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
     * ID에 해당하는 조직의 이름을 변경할 수 있게 상태를 변경한다.
     * @param {number} nId
     */
    renameNode: function (nId) {
        var welOrganization = this.getElementNodeById(nId);
        var oOrganization = this.oCollection.find(nId);

        if (!oOrganization.isRoot()) {
            welOrganization.addClass('editing');
            welOrganization.find('input').focus();
        }
    },

    /**
     * 현재 선택된 노드에 새 조직을 생성한다.
     * 생성 후 이름을 변경할 수 있게 편집 모드로 전환한다.
     */
    createNode: function () {
        var welOrganization = this.welTreeSet.find('a.selected');
        var nId = welOrganization.data('organization-id');
        var welChildrenList = this.getElementListById(nId);
        var welButton = welOrganization.siblings('button');
        var oSelf = this;

        this.oCollection.create(nId).done(function (oNewOrganization) {
            welChildrenList.append(oSelf._tmplPlainNode({
                organization: oNewOrganization
            }));
            welOrganization.addClass('has_child opened_child');
            welChildrenList.addClass('opened');
            welButton.html('폴더 닫기');
            oSelf.renameNode(oNewOrganization.nId);
        }).fail(function (error) {
            alert(error.responseText);
        });
    },

    /**
     * 이벤트를 바인드한다.
     * @private
     */
    _bindEvents: function () {
        this.welTreeSet.on('click', 'a.link', $.proxy(this._onClickSelectOrganization, this));
        this.welTreeSet.on('click', 'a.link', $.proxy(this._onClickOpenCloseOrganization, this));
        this.welTreeSet.on('click', 'input.edit_name', $.proxy(this._onClickInputName, this));
        this.welTreeSet.on('keyup', 'input.edit_name', $.proxy(this._onKeyupInoutName, this));
        this.welTreeSet.on('focusout', 'input.edit_name', $.proxy(this._onFocusoutInputName, this));
        this.welTitleSet.on('click', 'button', $.proxy(this._onClickAddOrganization, this));
    },

    /**
     * 조직 추가 버튼 click 이벤트 리스너
     * @private
     */
    _onClickAddOrganization: function () {
        this.createNode();
    },

    /**
     * 이름 입력란 click 이벤트 리스너
     * @private
     */
    _onClickInputName: function (oEvent) {
        oEvent.stopPropagation();
    },

    /**
     * 이름 입력한 keyup 이벤트 리스너
     * @param {KeyboardEvent} oEvent
     * @private
     */
    _onKeyupInoutName: function (oEvent) {
        var nEnterKey = 13;

        if (oEvent.keyCode === nEnterKey) {
            $(oEvent.currentTarget).blur();
        }
    },

    /**
     * 이름 입력한 focusout 이벤트 리스너
     * @param {MouseEvent} oEvent
     * @private
     */
    _onFocusoutInputName: function (oEvent) {
        var welInputName = $(oEvent.currentTarget);
        var welOrganization = welInputName.parents('a.link');
        var sNewName = welInputName.val();
        var nId = welOrganization.data('organization-id');

        welOrganization.removeClass('editing');

        this.oCollection.rename(nId, sNewName).done(function () {
            welOrganization.find('span.name').html(sNewName);
        }).fail(function (oError) {
            alert(oError.responseText);
        });
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
     * 조직을 삭제한다.
     * @param {number} nId
     */
    removeNode: function (nId) {
        var oOrganization = this.oCollection.find(nId);
        var oParent = this.oCollection.find(oOrganization.nParentId);
        var welOrganization = this.getElementNodeById(nId);
        var welParent = this.getElementNodeById(oParent.nId);

        this.oCollection.remove(nId).done(function () {
            welOrganization.parent('li').remove();

            if (!oParent.hasChildren()) {
                welParent.removeClass('has_child opened_child')
                    .siblings('ul').removeClass('opened');
            }
        }).fail(function (oError) {
            alert(oError.responseText);
        });
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
