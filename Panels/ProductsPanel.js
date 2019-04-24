 ﻿function newProductsPanel () {
   var thisObject = {
     container: undefined,
     getLoadingProductCards: getLoadingProductCards,
     draw: draw,
     getContainer: getContainer,     // returns the inner most container that holds the point received by parameter.
     initialize: initialize
   }

    /* Cointainer stuff */

   var container = newContainer()

   container.initialize()

   container.isDraggeable = true
   container.isWheelable = true

   thisObject.container = container

   let isInitialized = false
   let productCards = []

   let visibleProductCards = []
   let firstVisibleCard = 1

    /* Needed Variables */

   let lastY = 5
   let panelTabButton

   let exchange
   let market

   return thisObject

   function initialize (pExchange, pMarket) {
     exchange = pExchange
     market = pMarket

     thisObject.container.name = 'Layers @ ' + exchange + ' ' + market.assetB + '/' + market.assetA
     thisObject.container.frame.containerName = thisObject.container.name
     thisObject.container.frame.width = UI_PANEL.WIDTH.LARGE
     thisObject.container.frame.height = viewPort.visibleArea.bottomLeft.y - viewPort.visibleArea.topLeft.y // UI_PANEL.HEIGHT.LARGE;

     var position = {
       x: viewPort.visibleArea.topLeft.x,
       y: viewPort.visibleArea.bottomLeft.y - thisObject.container.frame.height
     }

     thisObject.container.frame.position = position

     panelTabButton = newPanelTabButton()
     panelTabButton.parentContainer = thisObject.container
     panelTabButton.container.frame.parentFrame = thisObject.container.frame
     panelTabButton.initialize()

     /* Get the current teams of the logged in user. */

     let storedTeams = window.localStorage.getItem('userTeams')
     let userTeams
     let userTeam = {slug: ''}
     if (storedTeams !== null && storedTeams !== undefined && storedTeams !== '') {
       userTeams = JSON.parse(storedTeams)
       userTeam = userTeams[0] // Currently we assume a user can be at only one team.
     }

        /* First thing is to build the productCards array */

     let devTeams = ecosystem.getTeams()

     for (let i = 0; i < devTeams.length; i++) {
       let devTeam = devTeams[i]

       for (let j = 0; j < devTeam.bots.length; j++) {
         let bot = devTeam.bots[j]

         if (bot.type !== 'Indicator' && bot.cloneId === undefined) { continue }
         if (bot.type === 'Indicator' && (devTeam.codeName !== 'AAMasters' && devTeam.codeName !== userTeam.slug)) { continue }

         if (bot.products !== undefined) {
           for (let k = 0; k < bot.products.length; k++) {
             let product = bot.products[k]
             // if (product.shareWith !== 'Public' && devTeam.codeName !== userTeam.slug) { continue }
                        /* Now we create Product objects */

             let productCard = newProductCard()

             productCard.devTeam = devTeam
             productCard.bot = bot
             productCard.product = product

             productCard.code = exchange + '-' + market.assetB + '/' + market.assetA + '-' + devTeam.codeName + '-' + bot.codeName + '-' + product.codeName

                        /* Initialize it */

             productCard.initialize()

                        /* Container Stuff */

             productCard.container.displacement.parentDisplacement = thisObject.container.displacement
             productCard.container.frame.parentFrame = thisObject.container.frame
             productCard.container.parentContainer = thisObject.container
             productCard.container.isWheelable = true

                        /* Positioning within thisObject Panel */

             let position = {
               x: 10,
               y: thisObject.container.frame.height - thisObject.container.frame.getBodyHeight()
             }

             productCard.container.frame.position.x = position.x
             productCard.container.frame.position.y = position.y + lastY

             lastY = lastY + productCard.container.frame.height

                        /* Add to the Product Array */

             productCards.push(productCard)

                        /* Add to Visible Product Array */

             if (productCard.container.frame.position.y + productCard.container.frame.height < thisObject.container.frame.height) {
               visibleProductCards.push(productCard)
             }

                        /* Listen to Status Changes Events */

             productCard.container.eventHandler.listenToEvent('Status Changed', onProductCardStatusChanged)
             productCard.container.eventHandler.listenToEvent('Mouse Wheel', onMouseWheel)
           }
         }
       }
     }

     thisObject.container.eventHandler.listenToEvent('Mouse Wheel', onMouseWheel)
     isInitialized = true
   }

   function onMouseWheel (event) {
     delta = event.wheelDelta
     if (delta > 0) {
       delta = -1
     } else {
       delta = 1
     }

     firstVisibleCard = firstVisibleCard + delta

     let availableSlots = visibleProductCards.length

     if (firstVisibleCard < 1) { firstVisibleCard = 1 }
     if (firstVisibleCard > (productCards.length - availableSlots + 1)) { firstVisibleCard = productCards.length - availableSlots + 1 }

     visibleProductCards = []
     var lastY = 5

     for (let i = 0; i < productCards.length; i++) {
       if (i + 1 >= firstVisibleCard && i + 1 < firstVisibleCard + availableSlots) {
         let productCard = productCards[i]

                /* Positioning within thisObject Panel */

         let position = {
           x: 10,
           y: thisObject.container.frame.height - thisObject.container.frame.getBodyHeight()
         }
         productCard.container.frame.position.x = position.x
         productCard.container.frame.position.y = position.y + lastY

         lastY = lastY + productCard.container.frame.height

                /* Add to Visible Product Array */

         visibleProductCards.push(productCard)
       }
     }
   }

   function onProductCardStatusChanged (pProductCard) {
     thisObject.container.eventHandler.raiseEvent('Product Card Status Changed', pProductCard)
   }

   function getLoadingProductCards () {
        /* Returns all productCards which status is LOADING */

     let onProducts = []

     for (let i = 0; i < productCards.length; i++) {
       if (productCards[i].status === PRODUCT_CARD_STATUS.LOADING) {
         onProducts.push(productCards[i])
       }
     }

     return onProducts
   }

   function getContainer (point) {
     var container

     container = panelTabButton.getContainer(point)
     if (container !== undefined) { return container }

        /* First we check if thisObject point is inside thisObject space. */

     if (thisObject.container.frame.isThisPointHere(point, true) === true) {
            /* Now we see which is the inner most container that has it */

       for (var i = 0; i < visibleProductCards.length; i++) {
         container = visibleProductCards[i].getContainer(point)

         if (container !== undefined) {
                    /* We found an inner container which has the point. We return it. */

           return container
         }
       }

            /* The point does not belong to any inner container, so we return the current container. */

       return thisObject.container
     } else {
            /* This point does not belong to thisObject space. */

       return undefined
     }
   }

   function draw () {
     if (isInitialized === false) { return }

     thisObject.container.frame.draw(false, false, true)

     for (let i = 0; i < visibleProductCards.length; i++) {
       visibleProductCards[i].draw()
     }

     panelTabButton.draw()
   }
 }
