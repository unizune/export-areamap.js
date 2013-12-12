var exportAreaMap = (function () {
    var elementToText = function (element) {
        return ($(element).wrap('<div></div>').parent()).html();
    };

    var extract = function () {
        Coords = function (object) {
            this.top = Number($(object).offset().top);
            this.left = Number($(object).offset().left);
            this.width = Number($(object).width());
            this.height = Number($(object).height());
            this.right = Number($(object).offset().left + $(object).width());
            this.bottom = Number($(object).offset().top + $(object).height());
        };

        Coords.prototype.toString = function () {
            return [this.left, this.top, this.right, this.bottom].join(",");
        };

        var areas = [];
        $("a").each(function () {
            var href = $(this).attr("href");
            var coords;
            if ($(this).children().size() === 1) {
                coords = new Coords($(this).children().get(0));
            } else {
                coords = new Coords(this);
            }
            var areaElement = $(document.createElement('area')).prop({"shape": "rect", "coords": coords.toString(), "href": href, "target": "_blank"});
            areas.push(areaElement);
        });

        $("img[usemap]").each(function () {
            var usemapSelector = $(this).attr("usemap");
            var imgCoords = new Coords(this);
            $(usemapSelector + " area[shape=rect]").each(function () {
                var coordsArray = ($(this).attr("coords")).split(",");
                coordsArray[0] = Number(coordsArray[0]) + imgCoords.left;
                coordsArray[1] = Number(coordsArray[1]) + imgCoords.top;
                coordsArray[2] = Number(coordsArray[2]) + imgCoords.left;
                coordsArray[3] = Number(coordsArray[3]) + imgCoords.top;
                var clone = $(this).clone();
                $(clone).attr("coords", coordsArray.join(","));
                areas.push(clone);
            });
        });

        return areas;
    };

    var toMap = function (areas) {
        var results = [];
        $.each(areas, function () {
            $(this).attr("target", "_black");
            tagText = elementToText(this);
            var coordsArray = ($(this).attr("coords")).split(",");

            results.push({"area_top": Number(coordsArray[1]), "area_bottom": Number(coordsArray[3]), "tagText": tagText});
        });
        return results;
    };

    var findOptimalHeightsToSplit = function (areas, maxSplitHeight) {
        maxSplitHeight = maxSplitHeight || 1000;
        var maxSize = $(document).height();

        var possibleAreaTop = 0;
        var results = [];
        while (true) {
            var possibleAreaBottom = possibleAreaTop + maxSplitHeight;
            if (possibleAreaBottom > maxSize) {
                break;
            }

            for (var index in areas) {
                var coordsArray = ($(areas[index]).attr("coords")).split(",");
                var top = coordsArray[1];
                var bottom = coordsArray[3];


                if (bottom < possibleAreaTop || top > possibleAreaBottom) {
                    continue;
                }
                if (bottom > possibleAreaBottom) {
                    possibleAreaBottom = Math.min(possibleAreaTop, bottom);
                }

                if (top > possibleAreaTop) {
                    possibleAreaTop = Math.min(possibleAreaBottom, top);
                }

            }

            results.push(possibleAreaBottom);
            possibleAreaTop = possibleAreaBottom;
        }
        results.push(maxSize);
        return results;
    };

    var splitAreasByHeights = function (heigths, areas) {
        results = [];

        var top = 0;
        for (var heightIndex in heigths) {
            var height = heigths[heightIndex];
            currentLevelResults = [];
            for (var index in areas) {
                var area = areas[index];
                var coordsArray = ($(area).attr("coords")).split(",");
                var topPosition = Number(coordsArray[1]);
                var bottomPosition = Number(coordsArray[3]);
                if ((bottomPosition < top) || (topPosition >= height)) {
                    continue;
                }

                var element = area.clone();
                element.attr("coords",
                    [coordsArray[0],
                        (((topPosition < top) ? top : topPosition) - top),
                        coordsArray[2],
                        (((bottomPosition > height) ? height : bottomPosition)) - top].join(","));
                currentLevelResults.push(elementToText(element));
            }
            results.push({"top": top, "bottom": height, "tagTexts": currentLevelResults});
            top = height;
        }
        return results;
    };

    return {
        extract: extract,
        optimalizeExtract: function(maxSplitHeight) {
            var areas = extract();
            return splitAreasByHeights(findOptimalHeightsToSplit(areas, maxSplitHeight), areas);
        }
    }
})();