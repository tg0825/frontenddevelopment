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
            var oOrganization = new naver.model.Organizations(htDataSet);
            var oParent = oSelf.find(oOrganization.nParentId);
            
            console.log(htDataSet);
        })
    },

    /**
     * 조직을 처음부터 마지막까지 순회한다.
     * @param {function} fnCallback
     */
    each: function (fnCallback) {
        var oSelf = this;

        _.each(this._aComposite, function (oOrganization) {
            oSelf._traverse(oOrganization, fnCallback);
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
     * @param {number|undefiend} nTargetId
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
            aOrganizations.push(new naver.model.Organizations(htDataSet));
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
