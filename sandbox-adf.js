/*
 â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ
â–ˆâ–ˆ   â–ˆâ–ˆ â–ˆâ–ˆ   â–ˆâ–ˆ â–ˆâ–ˆ
â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ â–ˆâ–ˆ   â–ˆâ–ˆ â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ
â–ˆâ–ˆ   â–ˆâ–ˆ â–ˆâ–ˆ   â–ˆâ–ˆ â–ˆâ–ˆ
â–ˆâ–ˆ   â–ˆâ–ˆ â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  â–ˆâ–ˆ

Advanced Donation Form (Blackbaud Checkout)
====================================================================
Client: BBIS Sandbox
Author(s): Mark Hillard
Product(s): BBIS
Created: 03/16/2020
Updated: 03/16/2020


CHANGELOG
====================================================================
03/16/2020: Initial build
12/09/2019: Updated GUIDs for the MasterConfig Environment (kh)
*/


var ADF = ADF || {
    Defaults: {
        // api
        rootPath: BLACKBAUD.api.pageInformation.rootPath,
        pageId: BLACKBAUD.api.pageInformation.pageId,
        pageName: $.trim($(document).find('title').text()),
        partId: $('.BBDonationApiContainer').data('partid'),

        // designation query
        designationQuery: '44a6ecf4-b908-4bfb-9fcc-83f162a9dc1f',

        // custom attributes
        comments: 'e3fe7cf0-7ffd-447a-979d-e73467ef94d6',
        matchingGift: '6840aed0-b85c-41c0-bb06-35df318abf0f',
        matchingGiftCompanyName: 'd3b38498-306a-4fd5-8f5f-07039334d208',

        // code tables
        titleTable: '456ffd4c-0fbf-49db-a503-0726f86e2a39',
        defaultCountry: 'd81cef85-7569-4b2e-8f2e-f7cf998a3342',

        // server date
        serverDate: new Date($('.BBDonationApiContainer').attr('serveryear'), $('.BBDonationApiContainer').attr('servermonth') - 1, $('.BBDonationApiContainer').attr('serverday')),

        // keys
        publicKey: '',
        hepKey: 'c158149ee05a1',

        // merchant account
        merchantAccountId: '',

        // checkout overlay
        opened: false,
        editorContent: '',
        checkoutError: 'There was an error while performing the operation. The page will be refreshed.',

        // order id
        orderId: '',
    },

    Methods: {
        pageInit: function() {
            // runs on partial page refresh
            Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(function() {
                ADF.Methods.pageRefresh();
            });

            // runs on full page load
            $(document).ready(function() {
                ADF.Methods.pageLoad();
            });
        },

        // page refresh
        pageRefresh: function() {
            // nothing to see here...
        },

        // full page load
        pageLoad: function() {
            if ($('.BBDonationApiContainer').length !== 0) {
                ADF.Methods.hiddenForm();
                ADF.Methods.getPublicKey();
                ADF.Methods.getEditorInformation();
                ADF.Methods.initAdf();
                ADF.Methods.buttonGroup();
                ADF.Methods.fundSearch();
                ADF.Methods.fundList();
                // ADF.Methods.matchingGiftSearch();
                ADF.Methods.validationMarkers();
                ADF.Methods.giftOptions();
                ADF.Methods.procFee();
                ADF.Methods.getCountryState();
                ADF.Methods.getTitle();
                ADF.Methods.datePicker();
                ADF.Methods.calculateInstallments();
            }
        },

        // returns a single value from the URL (pass in name of value)
        returnQueryValueByName: function(name) {
            return BLACKBAUD.api.querystring.getQueryStringValue(name);
        },

        // returns all query string parameters from a URL
        getUrlVars: function(url) {
            var vars = [],
                hash, hashes = url.slice(url.indexOf('?') + 1).split('&');
            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        },

        // hidden checkout form
        hiddenForm: function() {
            if ($('form[data-formtype="bbCheckout"]').length <= 0) {
                var form = '<form method=\'get\' id=\"paymentForm\" data-formtype=\'bbCheckout\' data-disable-submit=\'true\' novalidate><\/form>';
                $('body').prepend(form);
            }
        },

        // get public key
        getPublicKey: function() {
            var onPublicKeySuccess = function(data) {
                ADF.Defaults.publicKey = JSON.parse(data.Data).PublicKey;
            };

            var onPublicKeyFailure = function(error) {
                console.log(error);
            };

            donationService.getCheckoutPublicKey(onPublicKeySuccess, onPublicKeyFailure);
        },

        // get editor information
        getEditorInformation: function() {
            var partId = ADF.Defaults.partId;

            var onEditorContentSuccess = function(content) {
                ADF.Defaults.editorContent = content;
                ADF.Defaults.merchantAccountId = content.MerchantAccountID;
            };

            var onEditorContentFailure = function(error) {
                console.log(error);
            };

            donationService.getADFEditorContentInformation(partId, onEditorContentSuccess, onEditorContentFailure);
        },

        // get confirmation html
        getConfirmation: function(id) {
            var confirmationSuccess = function(content) {
                $('#adfWrapper').hide();
                $('#adfConfWrapper').removeClass('hidden').html(content);
            };

            var confirmationError = function(error) {
                $('#adfWrapper').hide();
                $('#adfConfWrapper').removeClass('hidden').html('<p>' + ADF.Methods.convertErrorsToHtml(error) + '</p>');
            };

            donationService.getDonationConfirmationHtml(id, confirmationSuccess, confirmationError);
        },

        // process credit card payment
        processCCPayment: function(data) {
            var onValidationSuccess = function() {
                ADF.Methods.makePayment(data);
                return false;
            };

            var onValidationFailed = function(error) {
                $('#adfError').html('<span class="fas fa-exclamation-circle"></span><p>' + ADF.Methods.convertErrorsToHtml(error) + '</p>');
                $('#adfError').show();
            };

            donationService.validateDonationRequest(data, onValidationSuccess, onValidationFailed);
        },

        // create donation for pledge (bill me later)
        billMeLater: function(data) {
            var donationSuccess = function(data) {
                ADF.Methods.getConfirmation(data.Donation.Id);
            };

            var donationFail = function(error) {
                $('#adfError').html('<span class="fas fa-exclamation-circle"></span><p>' + ADF.Methods.convertErrorsToHtml(error) + '</p>');
                $('#adfError').show();
            };

            donationService.createDonation(data, donationSuccess, donationFail);
        },

        // blackbaud checkout (credit card)
        makePayment: function(data) {
            // reset openend status
            ADF.Defaults.opened = false;

            var handleCheckoutComplete = function(event, token) {
                if (event && event.detail && event.detail.transactionToken) {
                    // complete donation
                    data.TokenId = event.detail.transactionToken;
                    donationService.checkoutDonationComplete(data, handlePaymentComplete, handleDonationCreateFailed);

                    // show overlay
                    $('#bbcheckout-background-overlay').show();
                } else {
                    ADF.Methods.handleError();
                }

                ADF.Methods.unBindPaymentCheckoutEvents();
                return false;
            };

            var handleCheckoutError = function() {
                ADF.Methods.handleError();
            };

            var handleCheckoutCancelled = function() {
                try {
                    donationService.checkoutDonationCancel(data, onSuccess, onFail);
                } catch (err) {
                    // nothing to see here...
                }

                ADF.Methods.unBindPaymentCheckoutEvents();
            };

            var handleCheckoutLoaded = function() {
                if (!ADF.Defaults.opened) {
                    // set opened status
                    ADF.Defaults.opened = true;

                    // get transaction id
                    var url = $('#bbcheckout-iframe').attr('src'),
                        tid = ADF.Methods.getUrlVars(url).t;

                    if (tid) {
                        data.TokenId = tid;
                        donationService.checkoutDonationCreate(data, handleDonationCreated, handleDonationCreateFailed);
                        return false;
                    }
                }

                return false;
            };

            var handleDonationCreated = function(data) {
                // get order id
                ADF.Defaults.orderId = JSON.parse(data.Data).OrderId;
            };

            var handleDonationCreateFailed = function() {
                ADF.Methods.handleError();
            };

            var handlePaymentComplete = function(data) {
                // hide overlay
                $('#bbcheckout-background-overlay').first().hide();

                // show confirmation html
                $('#adfWrapper').hide();
                $('#adfConfWrapper').removeClass('hidden').html(JSON.parse(data.Data).confirmationHTML);
            };

            // checkout service
            var checkout = new SecureCheckout(handleCheckoutComplete, handleCheckoutError, handleCheckoutCancelled, handleCheckoutLoaded),
                donor = data.Donor,
                checkoutData = {
                    Amount: $('.total-amount span').text().replace('$', '').replace(',', ''),
                    BillingAddressCity: donor.Address.City,
                    BillingAddressCountry: donor.Address.Country,
                    BillingAddressEmail: donor.EmailAddress,
                    BillingAddressFirstName: donor.FirstName,
                    BillingAddressLastName: donor.LastName,
                    BillingAddressLine: donor.Address.StreetAddress,
                    BillingAddressPostCode: donor.Address.PostalCode,
                    BillingAddressState: donor.Address.State,
                    Cardholder: donor.FirstName + ' ' + donor.LastName,
                    ClientAppName: 'University of South Carolina ADF',
                    FontFamily: ADF.Defaults.editorContent.FontType,
                    IsEmailRequired: true,
                    IsNameVisible: true,
                    MerchantAccountId: ADF.Defaults.editorContent.MerchantAccountID,
                    PrimaryColor: ADF.Defaults.editorContent.PrimaryFontColor,
                    SecondaryColor: ADF.Defaults.editorContent.SecondaryFontColor,
                    UseApplePay: ADF.Defaults.editorContent.UseApplePay,
                    UseCaptcha: ADF.Defaults.editorContent.RecaptchRequired,
                    UseMasterpass: ADF.Defaults.editorContent.UseMasterPass,
                    UseVisaCheckout: ADF.Defaults.editorContent.UseVisaPass,
                    key: ADF.Defaults.publicKey
                };

            // set card token (recurring gift)
            if (data.Gift && data.Gift.Recurrence) {
                checkoutData.CardToken = ADF.Defaults.editorContent.DataKey;
            }

            // process today or later (recurring gift)
            if (data.Gift && data.Gift.Recurrence && !data.Gift.Recurrence.ProcessNow) {
                return checkout.processStoredCard(checkoutData);
            } else {
                return checkout.processCardNotPresent(checkoutData);
            }
        },

        // handle generic checkout error
        handleError: function() {
            alert(ADF.Defaults.checkoutError);
            window.location.reload(true);
        },

        // unbind checkout events
        unBindPaymentCheckoutEvents: function() {
            $(document).unbind('checkoutComplete');
            $(document).unbind('checkoutLoaded');
            $(document).unbind('checkoutError');
            $(document).unbind('checkoutCancel');
        },

        // initialize ADF
        initAdf: function() {
            // legacy browser support for placeholder attributes
            $('input:not(".tt-hint"), textarea').placeholder();

            // character counter (comments)
            $('#comments').limit('#comments + .char-counter span');

            // submit button event
            $('#adfSubmit').on('click', function(e) {
                // prevent default action
                e.preventDefault();

                // form validation
                if ($('.fund-card.empty').is(':visible')) {
                    $('#adfError').html('<span class="fas fa-exclamation-circle"></span><p>Please select a fund from above and enter an amount.</p>');
                    $('#adfError').show();
                } else if (ADF.Methods.validateADF()) {
                    // hide error
                    $('#adfError').hide();

                    // get donation data
                    var data = ADF.Methods.getDonationData();

                    // credit card or bill me later
                    if (ADF.Defaults.editorContent && ADF.Defaults.editorContent.MACheckoutSupported && data.Gift.PaymentMethod === 0) {
                        ADF.Methods.processCCPayment(data);
                    } else {
                        ADF.Methods.billMeLater(data);
                    }
                } else {
                    // reset error
                    $('#adfError').html('<span class="fas fa-exclamation-circle"></span><p>Some required information is missing. Form submission is disabled until all required information is entered.</p>');
                }
            });
        },

        // button group functionality
        buttonGroup: function() {
            var button = $('.button-group .btn');

            // toggle active class
            button.on('click', function() {
                $(this).addClass('active');
                $(this).siblings().removeClass('active');
            });
        },

        // fund list
        fundList: function() {
            // fund list container
            var fundList = $('#fundList');

            // designation variables
            var query = new BLACKBAUD.api.QueryService(),
                results = [],
                data = ADF.Defaults.sampleData;

            // get results
            // query.getResults(ADF.Defaults.designationQuery, function (data) {
            // clean results
            var fields = data.Fields,
                rows = data.Rows,
                fieldArray = [];

            $.each(fields, function(key, value) {
                fieldArray[value.Name] = key;
            });

            $.each(rows, function() {
                var values = this.Values;
                results.push({
                    name: values[3],
                    id: values[4],
                    cat: values[1],
                    subcat: values[2]
                });
            });

            // filter unique values
            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }

            // get categories
            var category = results.map(function(obj) {
                return obj.cat;
            });

            // populate unique categories
            var uniqueCat = category.filter(onlyUnique);
            $.each(uniqueCat, function(key1, value1) {
                // build html structure for categories
                fundList.append('<div class="des-block"><div class="des-cat cat-' + key1 + '">' + value1 + '</div><div class="des-group"></div></div>');

                // filter categories
                var filterCat = $.grep(results, function(v) {
                    return v.cat === value1;
                });

                // get sub-categories from category filter
                var subCategory = filterCat.map(function(obj) {
                    return obj.subcat;
                });

                // populate unique sub-categories
                var uniqueSubCat = subCategory.filter(onlyUnique);
                $.each(uniqueSubCat, function(key2, value2) {
                    // build html structure for sub-categories
                    fundList.find('.cat-' + key1).next().append('<div class="des-area"><div class="des-subcat subcat-' + key2 + '">' + value2 + '</div><div class="des-select"></div></div>');

                    // filter designations
                    var filterDes = $.grep(results, function(v) {
                        return v.cat === value1 && v.subcat === value2;
                    });

                    // populate designations
                    $.each(filterDes, function(key3, value3) {
                        var desId = value3.id,
                            desName = value3.name,
                            desCat = value3.cat,
                            desSubcat = value3.subcat,
                            desInput = desId + '-' + desName.replace(/(_|\W)/g, '').toLowerCase();

                        // build html structure for designations
                        fundList.find('.cat-' + key1).next().find('.subcat-' + key2).next().append('<div class="checkbox"><input type="checkbox" id="' + desInput + '" value="' + desId + '" data-cat="' + desCat + '" data-subcat="' + desSubcat + '"><label for="' + desInput + '">' + desName + '</label></div>');
                    });
                });
            });

            // run fund selection
            ADF.Methods.fundCards();
            // });
        },

        // fund search
        fundSearch: function() {
            // typeahead variables
            var typeahead = $('#desSearch'),
                query = new BLACKBAUD.api.QueryService(),
                results = [],
                data = ADF.Defaults.sampleData;

            // get results
            // query.getResults(ADF.Defaults.designationQuery, function (data) {
            // clean results
            results = [];
            var fields = data.Fields,
                rows = data.Rows,
                fieldArray = [];

            $.each(fields, function(key, value) {
                fieldArray[value.Name] = key;
            });

            $.each(rows, function() {
                var values = this.Values;
                results.push({
                    value: values[4],
                    label: values[3],
                    cat: values[1],
                    subcat: values[2]
                });
            });

            // initialize suggestion engine
            var search = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label', 'cat', 'subcat'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: results
            });

            // initialize typeahead plugin
            var typeaheadInit = search.initialize();
            typeaheadInit.done(function() {
                typeahead.typeahead({
                    highlight: true,
                    minLength: 2
                }, {
                    display: 'label',
                    name: 'search',
                    source: search,
                    limit: 'Infinity',
                    templates: {
                        empty: function() {
                            return '<div class="no-match">No results found</div>';
                        },
                        suggestion: function(data) {
                            return '<div><p class="tt-hierarchy">' + data.cat + ' / ' + data.subcat + '</p><p class="tt-label">' + data.label + '</div>';
                        }
                    }
                }).on('typeahead:select', function(e, datum) {
                    $(this).data({
                        value: datum.value,
                        label: datum.label,
                        cat: datum.cat,
                        subcat: datum.subcat,
                        id: datum.value + '-' + datum.label.replace(/(_|\W)/g, '').toLowerCase()
                    });
                    ADF.Methods.addFund($(this));
                    clearSearch();
                }).on('typeahead:change', function() {
                    if ($.trim($(this).typeahead('val')) === '') {
                        clearSearch();
                    }
                });
            }).fail(function() {
                console.log('unable to parse designation query');
            });

            // clear search field
            function clearSearch() {
                typeahead.typeahead('val', '').typeahead('close');
                typeahead.removeData();
            }

            // autopopulate designation from url
            var guid = ADF.Methods.returnQueryValueByName('fund');
            if (!!guid) {
                var label = results.filter(function(obj) {
                    return obj.value === guid;
                })[0].label;
                typeahead.data('value', guid).typeahead('val', label);
            }
            // });
        },

        // matching gift search
        matchingGiftSearch: function() {
            // field variables
            var companySearch = $('#matchingGiftName'),
                searchResults = $('#matchingGiftSearchResults');

            // api variables
            var x2js = new X2JS(),
                key = ADF.Defaults.hepKey;

            // clear results
            function clearResults() {
                searchResults.find('ol').html('');
                $('.no-results').remove();
            }

            // currency formatting
            function formatCurrency(currencyString) {
                return parseFloat(currencyString).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                });
            }

            // search button keypress event (enter key)
            companySearch.on('keypress', function(e) {
                if ($(this).val() !== '' && $(this).is(':focus') && e.which === 13) {
                    e.preventDefault();
                    $('.hep-search').click();
                }
            });

            // search button click event
            $('.hep-search').on('click', function(e) {
                // prevent default action
                e.preventDefault();

                // clear results
                clearResults();

                // loading indicator
                searchResults.append('<p class="loading"><small>Loading...</small></p>');

                // search input value
                var searchValue = companySearch.val();

                // get companies
                $.get('https://automatch.matchinggifts.com/name_searches/xml/' + key + '/' + searchValue, function() {
                    // nothing to see here...
                }).done(function(data) {
                    // remove loading indicator
                    $('.loading').remove();

                    // data variables
                    var dataObj = x2js.xml2json(data),
                        count = dataObj.companies.count,
                        companies = dataObj.companies.company;

                    if (!!companies) {
                        // loop through companies
                        $(companies).each(function(i, v) {
                            // company variables
                            var companyId = v.company_id,
                                name = v.name;

                            searchResults.find('ol').append('<li><a href="#companyDetails" class="company" href="#" data-company-id="' + companyId + '" data-company-name="' + name + '">' + name + '</a></li>');
                        });
                    } else {
                        // no companies found
                        searchResults.append('<p class="no-results"><small>Sorry, "' + searchValue + '" was not found. Please check the spelling and re-submit.</small></p>');
                    }
                }).fail(function(errorThrown) {
                    console.log(errorThrown);
                }).always(function() {
                    // company link click event
                    $('.company').on('click', function() {
                        // company id (data attribute)
                        var companyId = $(this).data('company-id');

                        // company name (data attribute)
                        var companyName = $(this).data('company-name');

                        // get company details
                        $.get('https://automatch.matchinggifts.com/profiles/xml/' + key + '/' + companyId, function() {
                            // nothing to see here...
                        }).done(function(data) {
                            // data variables
                            var dataObj = x2js.xml2json(data),
                                company = dataObj.company,
                                subsidiaryOf = company.name,
                                companyId = company.company_id,
                                lastUpdated = company.last_updated,
                                contact = company.contact,
                                phone = company.contact_phone,
                                email = company.contact_email,
                                giftFormURL = company.online_resources.online_resource.matching_gift_form,
                                guide = company.online_resources.online_resource.guide,
                                minMatch = company.giftratios.minimum_amount_matched,
                                maxMatch = company.giftratios.maximum_amount_matched,
                                totalPerEmployee = company.giftratios.total_amount_per_employee,
                                giftRatio = company.giftratios.giftratio,
                                comments = company.comments,
                                procedure = Object.keys(company.procedure).map(function(i) {
                                    return company.procedure[i];
                                }).filter(Boolean),
                                companyDetails = $('<div><a href="#_" class="close"><span class="fas fa-fw fa-times"></span></a><strong>Company:</strong> ' + companyName + '<br><strong>Subsidiary of:</strong> ' + subsidiaryOf + '<br><strong>Foundation #:</strong> ' + companyId + '<br><strong>Last Updated:</strong> ' + lastUpdated + '<br><strong>Contact:</strong> ' + contact + '<br><strong>Phone:</strong> <a href="tel:' + phone + '">' + phone + '</a><br><strong>E-Mail:</strong> <a href="mailto:' + email + '">' + email + '</a><br><strong>Matching Gift Form URL:</strong> <a href="' + giftFormURL + '" target="_blank">' + giftFormURL + '</a><br><strong>Matching Gift Guidelines URL:</strong> <a href="' + guide + '" target="_blank">' + guide + '</a><br><strong>Minimum amount matched:</strong> ' + formatCurrency(minMatch) + '<br><strong>Maximum amount matched:</strong> ' + formatCurrency(maxMatch) + '<br><strong>Total per employee:</strong> ' + formatCurrency(totalPerEmployee) + '<br><strong>Gift ratio:</strong> ' + giftRatio + '<br><br><strong>Comments:</strong> ' + comments + '<br><br><strong>Procedure:</strong><br><ul><li>' + procedure.join('</li><li>') + '</li></ul><br><p><a href="#_" class="button select-company" data-select="' + companyName + '">Select Company</a><a href="#_" class="button return-to-list">Return to List</a></p></div>');

                            // reset company details
                            $('#companyDetails').html('');
                            companyDetails.appendTo('#companyDetails');

                            // select company click event
                            $('.select-company').on('click', function() {
                                // populate field value
                                companySearch.val($(this).data('select'));

                                // clear results
                                clearResults();
                            });
                        }).fail(function(errorThrown) {
                            console.log(errorThrown);
                        });
                    });
                });
            });
        },

        // fund card events
        fundCards: function() {
            // designation category
            $('.des-cat').each(function() {
                $(this).on('click', function() {
                    $(this).toggleClass('expanded');
                    $(this).next().slideToggle(200);
                    if ($(this).hasClass('expanded')) {
                        $(this).closest('.des-block').addClass('expanded');
                    } else {
                        $(this).closest('.des-block').removeClass('expanded');
                    }
                });
            });

            // designation sub-category
            $('.des-subcat').each(function() {
                $(this).on('click', function() {
                    $(this).toggleClass('expanded');
                    $(this).next().slideToggle(200);
                });
            });

            // designation selection
            $('.des-select .checkbox label').on('click', function() {
                if (!$(this).prev('input').is(':checked')) {
                    ADF.Methods.addFund($(this));
                } else {
                    var id = $(this).prev('input').attr('id');
                    ADF.Methods.removeFund(id);
                }
            });

            // fund card event (blur)
            $('#giftSummary').on('blur', '.fund-card input', function() {
                if (!isNaN($(this).val())) {
                    if (Number($(this).val()) < 10.00) {
                        $(this).val('0.00');
                        if ($(this).next('.min-amount').length === 0) {
                            $(this).parent().append('<p class="min-amount">Please enter a minimum of $10.</p>');
                        }
                    } else {
                        if ($(this).next('.min-amount').length !== 0) {
                            $(this).next('.min-amount').remove();
                        }
                        var newVal = parseFloat($(this).val(), 10).toFixed(2);
                        $(this).val(newVal);
                        ADF.Methods.updateTotal();
                    }
                } else {
                    $(this).val('0.00');
                }
            });

            // fund card events (change keyup focusout input paste)
            $('#giftSummary').on('change keyup focusout input paste', '.fund-card input', function(e) {
                if (!isNaN($(this).val())) {
                    // update total amount
                    ADF.Methods.updateTotal();

                    // update pledge summary
                    if ($('#pledgeGift').is(':checked')) {
                        ADF.Methods.pledgeSummary();
                    }
                }
            });

            // remove fund
            $('#giftSummary').on('click', '.remove-fund', function(e) {
                e.preventDefault();
                var id = $(this).closest('.fund-card').data('id');
                $('.des-select').find('#' + id).prop('checked', false);
                ADF.Methods.removeFund(id);

                // update pledge summary
                if ($('#pledgeGift').is(':checked')) {
                    ADF.Methods.pledgeSummary();
                }
            });
        },

        // add to cart
        addFund: function(elem) {
            // hide empty card
            if ($('.fund-card.empty').is(':visible')) {
                $('.fund-card.empty').addClass('hidden');
            }

            // fund data
            var value, label, cat, subcat, id;
            if (elem.is('#desSearch')) {
                value = elem.data('value');
                label = elem.data('label');
                cat = elem.data('cat');
                subcat = elem.data('subcat');
                id = elem.data('id');

                // select corresponding checkbox in fund list
                $('.des-select').find('#' + id).prop('checked', true);
            } else if (elem.is('.des-select .checkbox label')) {
                value = elem.prev('input').val();
                label = elem.text();
                cat = elem.prev('input').data('cat');
                subcat = elem.prev('input').data('subcat');
                id = elem.prev('input').attr('id');
            }

            // build fund card markup
            var card = $(
                '<div class="fund-card" data-id="' + id + '">' +
                '<div class="fund-card-header">' +
                '<p><span class="fund-cat">' + cat + '</span> / <span class="fund-subcat">' + subcat + '</span></p>' +
                '</div>' +
                '<div class="fund-card-block">' +
                '<div class="row">' +
                '<div class="g-5 t-g-2 relative remove-bottom"><p class="fund-name">' + label + '</p><p class="fund-guid hidden">' + value + '</p></div>' +
                '<div class="g-3 t-g-2 relative remove-bottom"><p class="symbol">$</p><input class="adfInput form-control required" type="number" required></div>' +
                '</div>' +
                '</div>' +
                '<div class="fund-card-footer">' +
                '<a href="#" class="button remove-fund"><span class="fas fa-times"></span>&nbsp;&nbsp;Remove Gift</a>' +
                '</div>' +
                '</div>'
            );

            // insert fund card
            card.insertBefore('.proc-fee');

            // update total amount
            ADF.Methods.updateTotal();

            // update pledge summary
            if ($('#pledgeGift').is(':checked')) {
                ADF.Methods.pledgeSummary();
            }
        },

        // remove fund
        removeFund: function(id) {
            // remove card
            if (!!id) {
                $('.fund-card[data-id="' + id + '"]').remove();
            }

            // no funds
            if ($('.fund-card').not('.empty, .proc-fee').length === 0) {
                $('.fund-card.empty').removeClass('hidden');
            }

            // update total amount
            ADF.Methods.updateTotal();

            // update pledge summary
            if ($('#pledgeGift').is(':checked')) {
                ADF.Methods.pledgeSummary();
            }
        },

        // update total
        updateTotal: function() {
            // cart variables
            var cartTotal = $('.total-amount span'),
                total = 0,
                newTotal,
                formatter = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                });

            // update processing fee
            if ($('#processingFee').is(':checked')) {
                ADF.Methods.updateProcessingFee();
            } else {
                $('.fund-card.proc-fee input').val('');
            }

            // update total amount
            $('.fund-card input').each(function() {
                var amount = Number($(this).val());
                total += +parseFloat(amount, 10).toFixed(2);
            }).promise().done(function() {
                newTotal = parseFloat(total, 10).toFixed(2);
                cartTotal.text(formatter.format(newTotal));
            });
        },

        // update processing fee
        updateProcessingFee: function() {
            // cache amount variables
            var total = 0;
            var subTotal = function() {
                // calculate cart subtotal
                $('.fund-card').not('.proc-fee').find('input').each(function() {
                    total += +parseFloat($(this).val(), 10).toFixed(2);
                });

                // calculate 3% processing fee
                return parseFloat(total * 0.03, 10).toFixed(2);
            };

            // populate fund card amount
            $('.fund-card.proc-fee input').val(subTotal);

            // display processing fee
            $('#processingFee + label > span').text($('.fund-card.proc-fee input').val());
        },

        // validation markers
        validationMarkers: function() {
            $('<span class="marker"></span>').insertBefore('.required');
        },

        // validate ADF
        validateADF: function() {
            // define validation status
            var isValid = true;

            // toggle validation classes on field edit
            $('.required:visible').each(function() {
                if ($.trim($(this).val()) === '' || $(this).val() === '-1' || $(this).is(':invalid')) {
                    isValid = false;
                    $(this).addClass('invalid');
                    $(this).parent().addClass('has-error');
                    $('html, body').stop().animate({
                        scrollTop: $('.invalid:first-of-type').offset().top - 100
                    }, 300);
                    $('#adfError').show();
                }
            });

            // focus on first invalid field
            $('.invalid:visible').first().focus();

            // toggle validation state on field edit
            $('.invalid').on('change keydown', function() {
                $(this).removeClass('invalid').parent().removeClass('has-error');

                if ($('.has-error').length === 0) {
                    // hide error
                    $('#adfError').hide();
                }
            });

            // return validation status
            return isValid;
        },

        // get donation data
        getDonationData: function() {
            // create donation object
            var donation = {
                Donor: {
                    FirstName: $('#personalFirstName').val(),
                    LastName: $('#personalLastName').val(),
                    EmailAddress: $('#personalEmail').val(),
                    Phone: $('#personalPhone').val(),
                    Address: {
                        StreetAddress: $('#personalAddress').val(),
                        City: $('#personalCity').val(),
                        State: $('#personalState').val(),
                        Country: $('#personalCountry option:selected').text(),
                        PostalCode: $('#personalZip').val(),
                    }
                },
                Gift: {
                    Designations: [],
                    Attributes: [],
                    IsCorporate: false,
                    IsAnonymous: false,
                    PaymentMethod: 0
                },
                Origin: {
                    PageId: ADF.Defaults.pageId,
                    PageName: 'ADF'
                },
                BBSPTemplateSitePageId: ADF.Defaults.pageId,
                MerchantAccountId: ADF.Defaults.merchantAccountId,
                PartId: ADF.Defaults.partId
            };

            // assign designations (split gifts)
            $('.fund-card').not('.empty, .proc-fee:hidden').each(function() {
                var gift = {
                    Amount: $(this).find('input').val(),
                    DesignationId: $(this).find('.fund-guid').text()
                };
                donation.Gift.Designations.push(gift);
            });

            // assign donor title and custom attributes
            try {
                // donor title
                if ($('#personalTitle').val() !== '-1') {
                    donation.Donor.Title = $('#personalTitle option:selected').text();
                }

                // comments
                if ($('#comments').val() !== '') {
                    var comments = {
                        AttributeId: ADF.Defaults.comments,
                        Value: $('#comments').val()
                    };
                    donation.Gift.Attributes.push(comments);
                }

                // matching gift
                if ($('#matchingGift').is(':checked')) {
                    var matchingGift = {
                        AttributeId: ADF.Defaults.matchingGift,
                        Value: 'True'
                    };
                    donation.Gift.Attributes.push(matchingGift);

                    // matching gift company name
                    if ($('#matchingGiftSearch').val() !== '') {
                        var matchingGiftCompanyName = {
                            AttributeId: ADF.Defaults.matchingGiftCompanyName,
                            Value: $('#matchingGiftName').val()
                        };
                        donation.Gift.Attributes.push(matchingGiftCompanyName);
                    }
                }

                // usc fields
                if ($('#usc').is(':checked')) {
                    var usc = {
                        AttributeId: ADF.Defaults.usc,
                        Value: 'True'
                    };
                    donation.Gift.Attributes.push(usc);

                    // usc campus
                    if ($('#uscCampus').val() !== '-1') {
                        var uscCampus = {
                            AttributeId: ADF.Defaults.uscCampus,
                            Value: $('#uscCampus option:selected').text()
                        };
                        donation.Gift.Attributes.push(uscCampus);
                    }

                    // usc college
                    if ($('#uscCollege').val() !== '') {
                        var uscCollege = {
                            AttributeId: ADF.Defaults.uscCollege,
                            Value: $('#uscCollege').val()
                        };
                        donation.Gift.Attributes.push(uscCollege);
                    }

                    // usc department
                    if ($('#uscDept').val() !== '') {
                        var uscDept = {
                            AttributeId: ADF.Defaults.uscDept,
                            Value: $('#uscDept').val()
                        };
                        donation.Gift.Attributes.push(uscDept);
                    }
                }
            } catch (err) {
                console.log(err);
            }

            // conditional for anonymous
            if ($('#anonymousGift').is(':checked')) {
                donation.Gift.IsAnonymous = true;
            }

            // conditional for corporate
            if ($('#corporateGift').is(':checked')) {
                donation.Gift.IsCorporate = true;
                donation.Donor.OrganizationName = $('#companyName').val();
            }

            // conditional for tribute
            if ($('#tributeGift').is(':checked') && !$('#ackLetter').is(':checked')) {
                donation.Gift.Tribute = {
                    TributeDefinition: {
                        Type: $('#tributeType input:checked').val(),
                        Description: 'New Tribute',
                        FirstName: $('#tributeFirstName').val(),
                        LastName: $('#tributeLastName').val()
                    }
                };
            }

            // conditional for tribute acknowledgement
            if ($('#tributeGift').is(':checked') && $('#ackLetter').is(':checked')) {
                donation.Gift.Tribute = {
                    TributeDefinition: {
                        Type: $('#tributeType input:checked').val(),
                        Description: 'New Tribute',
                        FirstName: $('#tributeFirstName').val(),
                        LastName: $('#tributeLastName').val()
                    },
                    Acknowledgee: {
                        FirstName: $('#acknowledgeeFirstName').val(),
                        LastName: $('#acknowledgeeLastName').val(),
                        AddressLines: $('#acknowledgeeAddress').val(),
                        City: $('#acknowledgeeCity').val(),
                        State: $('#acknowledgeeState').val(),
                        PostalCode: $('#acknowledgeeZip').val(),
                        Country: $('#acknowledgeeCountry option:selected').text()
                    }
                };
            }

            // conditional for recurring
            if ($('#recurringGift').is(':checked')) {
                // field variables
                var frequency = $("#frequency").val(),
                    startDate = new Date($('#startDate').attr('data-date')),
                    endDate = new Date($('#endDate').val().replace(/-/g, '\/')),
                    dayOfMonth = startDate.getDate(),
                    month = startDate.getMonth() + 1;

                // monthly, quarterly, or annually
                if (frequency === '2') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Frequency: 2,
                        StartDate: startDate,
                        EndDate: !!endDate ? endDate : '',
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                } else if (frequency === '3') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Frequency: 3,
                        StartDate: startDate,
                        EndDate: !!endDate ? endDate : '',
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                } else if (frequency === '4') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Month: month,
                        Frequency: 4,
                        StartDate: startDate,
                        EndDate: !!endDate ? endDate : '',
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                }
            }

            // conditional for pledge installments
            if ($('#pledgeGift').is(':checked')) {
                // field variables
                var frequency = $("#pledgeFrequency").val(),
                    startDate = new Date($('#pledgeStartDate').attr('data-date')),
                    endDate = new Date($('#pledgeEndDate').val().replace(/-/g, '\/')),
                    dayOfMonth = startDate.getDate(),
                    month = startDate.getMonth() + 1;

                // monthly, quarterly, or annually
                if (frequency === '2') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Frequency: 2,
                        StartDate: startDate,
                        EndDate: endDate,
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                } else if (frequency === '3') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Frequency: 3,
                        StartDate: startDate,
                        EndDate: endDate,
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                } else if (frequency === '4') {
                    donation.Gift.Recurrence = {
                        DayOfMonth: dayOfMonth,
                        Month: month,
                        Frequency: 4,
                        StartDate: startDate,
                        EndDate: endDate,
                        ProcessNow: ADF.Methods.isProcessNow()
                    };
                }

                // installment variables
                var numberOfInstallments = $('#pledgeInstallments').val(),
                    installmentAmount = $('.installment-amount').text().replace('$', '').replace(',', '');

                donation.Gift.PledgeInstallment = {
                    NumberOfInstallments: numberOfInstallments,
                    InstallmentAmount: installmentAmount
                };
            }

            // conditional for bill me later
            if ($('#billMeLater').is(':checked')) {
                donation.Gift.PaymentMethod = 1;
            }

            // set bbsp return url (credit card)
            if (donation.Gift.PaymentMethod === 0) {
                donation.BBSPReturnUri = window.location.href;
            }

            // if finder number is in URL (core BBIS functionality)
            if (!!ADF.Methods.returnQueryValueByName('efndnum')) {
                donation.Gift.FinderNumber = ADF.Methods.returnQueryValueByName('efndnum');
            }

            // if source code is in URL (core BBIS functionality)
            if (!!ADF.Methods.returnQueryValueByName('source')) {
                donation.Gift.SourceCode = ADF.Methods.returnQueryValueByName('source');
            }

            // if appeal id exists
            if ($('#appeal').length !== 0 && !$('#appeal').is(':empty')) {
                donation.Gift.AppealId = $('#appeal').text();
            }

            // return donation object
            return donation;
        },

        // check equality of server date and (recurring or pledge installment gift) start date
        isProcessNow: function() {
            var frequency,
                startDate;

            if ($('#recurringGift').is(':checked')) {
                frequency = $("#frequency").val();
                startDate = new Date($('#startDate').attr('data-date'));
            } else if ($('#pledgeGift').is(':checked')) {
                frequency = $("#pledgeFrequency").val();
                startDate = new Date($('#pledgeStartDate').attr('data-date'));
            }

            var dayOfMonth = startDate.getDate(),
                month = startDate.getMonth() + 1,
                serverDate = ADF.Defaults.serverDate,
                recurrenceStartDate = startDate,
                startDateIsTodayDate = false,
                isProcessedNow = false;

            if (recurrenceStartDate.getFullYear() === serverDate.getFullYear() && recurrenceStartDate.getMonth() === serverDate.getMonth() && recurrenceStartDate.getDate() === serverDate.getDate()) {
                startDateIsTodayDate = true;
            } else {
                return false;
            }

            if (frequency === '2' || frequency === '3') {
                isProcessedNow = startDateIsTodayDate && dayOfMonth === serverDate.getDate();
            } else if (frequency === '4') {
                isProcessedNow = startDateIsTodayDate && dayOfMonth === serverDate.getDate() && month === serverDate.getMonth() + 1;
            } else {
                isProcessedNow = false;
            }

            return isProcessedNow;
        },

        // api error handling
        convertErrorToString: function(error) {
            if (error) {
                if (error.Message)
                    return error.Message;
                switch (error.ErrorCode) {
                    case 101:
                        if (true) {
                            return error.Field + ' is required.';
                        }
                        break;
                    case 102:
                        if (true) {
                            return error.Field + ' is invalid.';
                        }
                        break;
                    case 103:
                        if (true) {
                            return error.Field + ' is below minimum.';
                        }
                        break;
                    case 104:
                        if (true) {
                            return error.Field + ' exceeds maximum.';
                        }
                        break;
                    case 105:
                        if (true) {
                            return error.Field + ' is not allowed.';
                        }
                        break;
                    case 106:
                        if (true) {
                            return 'Record for ' + error.Field + ' was not found.';
                        }
                        break;
                    case 107:
                        if (true) {
                            return 'Max length for ' + error.Field + ' exceeded.';
                        }
                        break;
                    case 203:
                        if (true) {
                            return 'Your donation was not completed and your credit card has not been charged. Please try again later.';
                        }
                        break;
                    default:
                        return 'Error code ' + error.ErrorCode + '.';
                }
            }
        },

        // convert errors to html
        convertErrorsToHtml: function(errors) {
            // process error
            var i, message = 'Unknown error.<br/>';
            if (errors) {
                message = '';
                for (i = 0; i < errors.length; i++) {
                    message = message + ADF.Methods.convertErrorToString(errors[i]) + '<br/>';
                }
            }
            return message;
        },

        // gift options
        giftOptions: function() {
            // field variables
            var recurringGift = $('#recurringGift'),
                recurringGiftSection = $('#recurringGiftSection'),
                endingDate = $('#endingDate'),
                pledgeGift = $('#pledgeGift'),
                pledgeGiftSection = $('#pledgeGiftSection'),
                tributeGift = $('#tributeGift'),
                honoreeSection = $('#honoreeSection'),
                acknowledgeeLetter = $('#ackLetter'),
                acknowledgeeSection = $('#acknowledgeeSection'),
                matchingGift = $('#matchingGift'),
                matchingGiftSection = $('#matchingGiftSection'),
                usc = $('#usc'),
                uscSection = $('#uscSection'),
                corpGift = $('#corporateGift'),
                corpGiftSection = $('#corporateGiftSection');

            // recurring gift selection
            recurringGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show recurring gift fields
                    recurringGiftSection.removeClass('hidden');

                    // hide pledge gift checkbox
                    pledgeGift.parent().addClass('hidden');

                    // uncheck pledge gift checkbox if checked
                    if (pledgeGift.is(':checked')) {
                        pledgeGift.click();
                    }

                    // hide tribute checkbox
                    tributeGift.parent().addClass('hidden');

                    // uncheck tribute checkbox if checked
                    if (tributeGift.is(':checked')) {
                        tributeGift.click();
                    }

                    // uncheck acknowledgee checkbox if checked
                    if (acknowledgeeLetter.is(':checked')) {
                        acknowledgeeLetter.click();
                    }
                } else {
                    // hide recurring gift fields
                    recurringGiftSection.addClass('hidden');

                    // show pledge gift checkbox
                    pledgeGift.parent().removeClass('hidden');

                    // show tribute checkbox
                    tributeGift.parent().removeClass('hidden');
                }

                // toggle ending date section
                if (endingDate.is(':checked') && !$(this).is(':checked')) {
                    endingDate.click();
                }
            });

            // optional end date selection
            endingDate.on('change', function() {
                if ($(this).is(':checked')) {
                    $(this).closest('.row').next('.row').removeClass('hidden');
                } else {
                    $(this).closest('.row').next('.row').addClass('hidden');
                }
            });

            // pledge gift selection
            pledgeGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show pledge gift fields
                    pledgeGiftSection.removeClass('hidden');

                    // hide recurring checkbox
                    recurringGift.parent().addClass('hidden');

                    // uncheck recurring checkbox if checked
                    if (recurringGift.is(':checked')) {
                        recurringGift.click();
                    }

                    // uncheck acknowledgee checkbox if checked
                    if (acknowledgeeLetter.is(':checked')) {
                        acknowledgeeLetter.click();
                    }

                    // hide tribute checkbox
                    tributeGift.parent().addClass('hidden');

                    // uncheck tribute checkbox if checked
                    if (tributeGift.is(':checked')) {
                        tributeGift.click();
                    }
                } else {
                    // hide pledge gift fields
                    pledgeGiftSection.addClass('hidden');

                    // show recurring checkbox
                    recurringGift.parent().removeClass('hidden');

                    // show tribute checkbox
                    tributeGift.parent().removeClass('hidden');
                }
            });

            // tribute selection
            tributeGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show honoree section
                    honoreeSection.removeClass('hidden');

                    // hide recurring gift section
                    recurringGiftSection.addClass('hidden');
                    recurringGift.parent().addClass('hidden');

                    // hide pledge gift section
                    pledgeGiftSection.addClass('hidden');
                    pledgeGift.parent().addClass('hidden');
                } else {
                    // hide honoree and acknowledgee sections
                    honoreeSection.addClass('hidden');
                    acknowledgeeSection.addClass('hidden');

                    // show recurring gift checkbox
                    recurringGift.parent().removeClass('hidden');

                    // show pledge gift checkbox
                    pledgeGift.parent().removeClass('hidden');
                }

                // toggle acknowledgee section
                if (acknowledgeeLetter.is(':checked') && !$(this).is(':checked')) {
                    acknowledgeeLetter.click();
                }
            });

            // acknowledgee selection
            acknowledgeeLetter.on('change', function() {
                if ($(this).is(':checked')) {
                    // show acknowledgee section
                    acknowledgeeSection.removeClass('hidden');
                } else {
                    // hide acknowledgee section
                    acknowledgeeSection.addClass('hidden');
                }
            });

            // matching gift selection
            matchingGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show matching gift section
                    matchingGiftSection.removeClass('hidden');

                    // hide corporate gift checkbox
                    corpGift.parent().addClass('hidden');
                } else {
                    // hide matching gift section
                    matchingGiftSection.addClass('hidden');

                    // show corporate gift checkbox
                    corpGift.parent().removeClass('hidden');
                }
            });

            // usc selection
            usc.on('change', function() {
                if ($(this).is(':checked')) {
                    // show usc section
                    uscSection.removeClass('hidden');
                } else {
                    // hide usc section
                    uscSection.addClass('hidden');
                }
            });

            // corporate gift selection
            corpGift.on('change', function() {
                if ($(this).is(':checked')) {
                    // show company name section
                    corpGiftSection.removeClass('hidden');

                    // hide matching gift checkbox
                    matchingGift.parent().addClass('hidden');

                    // uncheck matching gift checkbox if checked
                    if (matchingGift.is(':checked')) {
                        matchingGift.click();
                    }
                } else {
                    // hide company name section
                    corpGiftSection.addClass('hidden');

                    // show matching gift checkbox
                    matchingGift.parent().removeClass('hidden');
                }
            });
        },

        // processing fee
        procFee: function() {
            // fund card
            var pf = $('.fund-card.proc-fee');

            // toggle transaction fee
            $('#processingFee').on('click', function() {
                // toggle visibility
                pf.toggleClass('hidden');

                // update total amount
                ADF.Methods.updateTotal();

                // update pledge summary
                if ($('#pledgeGift').is(':checked')) {
                    ADF.Methods.pledgeSummary();
                }
            });

            // remove transaction fee
            pf.find('.remove-fee').on('click', function(e) {
                e.preventDefault();
                $('#processingFee').click();
            });
        },

        // get countries and states
        getCountryState: function() {
            var selectDonorCountry = $('#personalCountry'),
                selectDonorState = $('#personalState'),
                selectAckCountry = $('#acknowledgeeCountry'),
                selectAckState = $('#acknowledgeeState');

            // load countries
            $.get(ADF.Defaults.rootPath + 'webapi/country', function(countries) {
                for (var i = 0, j = countries.length; i < j; i++) {
                    selectDonorCountry.append('<option value="' + countries[i].Id + '">' + countries[i].Description + '</option>');
                    selectAckCountry.append('<option value="' + countries[i].Id + '">' + countries[i].Description + '</option>');
                }
            }).done(function() {
                // default country (United States)
                selectDonorCountry.val(ADF.Defaults.defaultCountry).change();
                selectAckCountry.val(ADF.Defaults.defaultCountry).change();
            });

            // watch country change (donor)
            selectDonorCountry.on('change', function() {
                // load states
                $.get(ADF.Defaults.rootPath + 'webapi/country/' + $(this).val() + '/state', function(states) {
                    selectDonorState.html('');
                    for (var i = 0, j = states.length; i < j; i++) {
                        selectDonorState.append('<option value="' + states[i].Abbreviation + '">' + states[i].Description + '</option>');
                    }
                    selectDonorState.prepend('<option value="-1">State/Territory</option>').val('-1');
                }).done(function() {
                    if (selectDonorState.find('option').length < 2) {
                        selectDonorState.removeAttr('required').removeClass('required');
                        selectDonorState.siblings('.marker').hide();
                    } else {
                        selectDonorState.prop('required', true).addClass('required');
                        selectDonorState.siblings('.marker').show();
                    }
                });
            });

            // watch country change (acknowledgee)
            selectAckCountry.on('change', function() {
                // load states
                $.get(ADF.Defaults.rootPath + 'webapi/country/' + $(this).val() + '/state', function(states) {
                    selectAckState.html('');
                    for (var i = 0, j = states.length; i < j; i++) {
                        selectAckState.append('<option value="' + states[i].Abbreviation + '">' + states[i].Description + '</option>');
                    }
                    selectAckState.prepend('<option value="-1">State/Territory</option>').val('-1');
                }).done(function() {
                    if (selectAckState.find('option').length < 2) {
                        selectAckState.removeAttr('required').removeClass('required');
                        selectAckState.siblings('.marker').hide();
                    } else {
                        selectAckState.prop('required', true).addClass('required');
                        selectAckState.siblings('.marker').show();
                    }
                });
            });
        },

        // get title table
        getTitle: function() {
            var donorTitle = $('#personalTitle');

            $.get(ADF.Defaults.rootPath + 'webapi/CodeTable/' + ADF.Defaults.titleTable, function(data) {
                for (var i = 0, j = data.length; i < j; i++) {
                    donorTitle.append('<option value="' + data[i].Id + '">' + data[i].Description + '</option>');
                }
            }).done(function() {
                donorTitle.val('-1').change();
            });
        },

        // date picker behavior
        datePicker: function() {
            // today's date
            var date = new Date(),
                today = date.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }).replace(/\u200E/g, '');

            if ($('html').hasClass('-ms-')) {
                $('#startDate').val(today);
                $('#pledgeStartDate').val(today);
            } else {
                $('#startDate').val(new Date(today).toISOString().substring(0, 10));
                $('#pledgeStartDate').val(new Date(today).toISOString().substring(0, 10));
            }

            // normalized date attribute
            $('#startDate').attr('data-date', today);
            $('#pledgeStartDate').attr('data-date', today);
        },

        // calculate installments
        calculateInstallments: function() {
            // run on all field events
            $('#pledgeInstallments').add('#pledgeFrequency').on('change keyup focusout input paste', function() {
                ADF.Methods.pledgeSummary();
            });
        },

        // pledge summary
        pledgeSummary: function() {
            // pledge installment helper function variables
            var totalGiftAmount = $('.total-amount span').text().replace('$', '').replace(',', ''),
                numberOfInstallments = $('#pledgeInstallments').val(),
                frequencyCode = $('#pledgeFrequency').val(),
                installmentStartDate = new Date($('#pledgeStartDate').attr('data-date')),
                installmentDayOfMonth = installmentStartDate.getDate(),
                installmentMonth = installmentStartDate.getMonth() + 1;

            // pledge summary logic
            if ($('.fund-card.empty').hasClass('hidden') && $('#pledgeFrequency').val() !== '-1' && $('#pledgeInstallments').val() !== '' && $('.min-amount').length === 0) {
                // payment info variables
                var GiftLastPaymentDate = donationService.getRecurringGiftLastPaymentDate(numberOfInstallments, frequencyCode, installmentStartDate, installmentMonth, installmentDayOfMonth).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                    }),
                    GiftInstallmentAmount = donationService.getRecurringGiftInstallmentAmount(totalGiftAmount, numberOfInstallments);

                // convert currency format
                var formatter = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    }),
                    formattedInstallmentAmount = formatter.format(GiftInstallmentAmount);

                // pledge summary content variable
                var pledgeSummary = numberOfInstallments + ' installments of <span class="installment-amount">' + formattedInstallmentAmount + '</span> ' + $('#pledgeFrequency option:selected').text().toLowerCase() + 'until ' + GiftLastPaymentDate;

                // set pledge installment end date
                if ($('html').hasClass('-ms-')) {
                    $('#pledgeEndDate').val(GiftLastPaymentDate);
                } else {
                    $('#pledgeEndDate').val(new Date(GiftLastPaymentDate).toISOString().substring(0, 10));
                }

                // show pledge summary
                $('#pledgeSummary').show().find('p').html(pledgeSummary);
            } else {
                // reset pledge installment end date
                $('#pledgeEndDate').val('');

                // hide pledge summary
                $('#pledgeSummary').hide();
            }
        }
    }
};

// create new instance of donation service (global)
var donationService = new BLACKBAUD.api.DonationService(ADF.Defaults.partId);

// run scripts
ADF.Methods.pageInit();

// character counter
(function($) {
    $.fn.extend({
        limit: function(element) {
            var self = $(this),
                limit = self.attr('maxlength');
            self.keyup(function() {
                var length = self.val().length;
                var count = limit - length;
                $(element).text(count);
            });
        }
    });
})(jQuery);

// invalid expression matcher (form validation)
jQuery.extend(jQuery.expr[':'], {
    invalid: function(elem, index, match) {
        var invalids = document.querySelectorAll(':invalid'),
            result = false,
            len = invalids.length;

        if (len) {
            for (var i = 0; i < len; i++) {
                if (elem === invalids[i]) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }
});