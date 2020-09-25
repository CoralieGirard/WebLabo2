const Repository = require('../models/Repository');

module.exports =
    class BookmarksControler extends require('./Controller') {
        constructor(req, res) {
            super(req, res);
            this.bookmarksRepository = new Repository('Bookmarks');
        }

        get(id) {
            let params = this.getQueryStringParams();
            console.log(params);

            var response = this.bookmarksRepository.getAll();

            if (!isNaN(id))
                this.response.JSON(this.bookmarksRepository.get(id));
            else if (params == null)
                this.response.JSON(this.bookmarksRepository.getAll());
            else if (Object.keys(params).length === 0)
                this.response.JSON([{ "message": " Possible option; 'sort' by 'name' or 'category'; 'name' or 'name*'; 'category'" }]);
            else if('sort' in params || 'name' in params || 'category' in params){
                if ('sort' in params)
                    response = this.doSort(params.sort, response);
                if ('category' in params)
                    response = this.searchCategory(params.category, response);
                if ('name' in params)
                    response = this.searchName(params.name, response);

                this.response.JSON(response);
            }
            else
                return this.error(params, "'sort', 'name' and 'category' parameter is missing");
        }

        post(Bookmarks) {
            if (Bookmarks.Name == null || Bookmarks.Name == '' || Bookmarks.Category == null || Bookmarks.Category == '' || Bookmarks.Url == null || Bookmarks.Url == '')
                this.error(Bookmarks, "Name. category and url can't be null or empty.");
            else if(!this.checkNameExist(Bookmarks.Name))
                this.error(Bookmarks, "Name already exist.");
            else if(!this.checkUrl(Bookmarks.Url))
                this.error(Bookmarks, "Url isn't valid.");
            else {
                let newBookmark = this.bookmarksRepository.add(Bookmarks);
                if (newBookmark)
                    this.response.created(JSON.stringify(newBookmark));
                else
                    this.response.internalError();
            }
        }

        put(Bookmarks) {
            if (Bookmarks.Name == null || Bookmarks.Name == '' || Bookmarks.Category == null || Bookmarks.Category == '' || Bookmarks.Url == null || Bookmarks.Url == '')
                this.error(Bookmarks, "Name, category and url can't be null or empty.");
            else if(!this.checkNameExist(Bookmarks.Name))
                this.error(Bookmarks, "Name already exist.");
            else if(!this.checkUrl(Bookmarks.Url))
                this.error(Bookmarks, "Url isn't valid.");
            else {
                if (this.bookmarksRepository.update(Bookmarks))
                    this.response.ok();
                else
                    this.response.notFound();
            }
        }

        checkNameExist(name)
        {
            var allEntry = this.bookmarksRepository.getAll();
            var tab = [];

            allEntry.forEach(element => {
                if (element.Name == name)
                    tab.push(element);
            });

            if(tab.length == 0)
                return true;
            else
                return false;
        }

        checkUrl(url)
        {
            var tabDomaine = ['.com', '.ca', '.fr', '.qc', '.edu', '.gov', '.net', '.org'];
            var bool = false;

            tabDomaine.forEach(domaine => {
                if(url.includes(domaine))
                    bool = true;
            })

            return bool;
        }

        remove(id) {
            if (this.bookmarksRepository.remove(id))
                this.response.accepted();
            else
                this.response.notFound();
        }

        doSort(params, allEntry) {
            if (params == 'name') {
                allEntry.sort(function (a, b) {
                    if (a.Name < b.Name) { return -1; }
                    if (a.Name > b.Name) { return 1; }
                    return 0;
                });
            }
            else if (params == 'category') {
                allEntry.sort(function (a, b) {
                    if (a.Category > b.Category) { return 1; }
                    else if (a.Category < b.Category) { return -1; }
                    return 0;
                });
                allEntry.reverse();
            }
            else
                this.error(params, "sort parameter is empty or null");

            return allEntry;
        }

        searchName(params, allEntry) {
            var response = [];

            if (params != null && params != '') {
                if (params.includes('*')) {
                    params = params.replace('*', '');
                    allEntry.forEach(element => {
                        if (element.Name.startsWith(params))
                            response.push(element);
                    });
                }
                else {
                    allEntry.forEach(element => {
                        if (element.Name == params)
                            response.push(element);
                    });
                }

                if (response == [])
                    this.error(params, "this name doesn't exist.");
            }
            else
                this.error(params, "one of the params parameter is empty or null.");

            return response;
        }

        searchCategory(params, allEntry) {
            var response = [];

            if (params != null && params != '') {
                allEntry.forEach(element => {
                    if (element.Category == params)
                        response.push(element);
                });

                if (response == [])
                    this.error(params, "this category doesn't exist.");
            }
            else
                this.error(params, "one of the params parameter is empty or null.");

            return response;
        }

        error(params, message) {
            params["error"] = message;
            this.response.JSON(params);
            return false;
        }

    }