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
