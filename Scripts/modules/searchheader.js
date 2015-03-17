define(["knockout", "Scripts/text!modules/searchheader.html"], function (ko, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.name = params.name;
            self.comment = params.comment;
            self.isSearchBoxShown = params.isSearchBoxShown;
            self.totalItemIndex = params.totalItemIndex;
            self.textQuery = params.textQuery;
            self.searchText = params.searchText;
            self.isSubmitForm = params.isSubmitForm;
            self.placeholder = params.placeholder;

            self.trySearchText = function () {
                if (self.isSubmitForm == true)
                    self.searchText();
            };
        },
        template: htmlText
    }
});