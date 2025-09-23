# Product Requirements Document

Create a simple web based vue.js app that has the following features:

    * each member of a family is assigned a 'reward' (eg/ a digital watch) along with a 'task' (eg/ make bed) where 30 completions of the task unlocks the reward.

    * the dashboard should show each person's name/mug shot/photo of reward/photo of task along with 30 empty boxes and stars inside the box when a task is completed. 

    * there should be a way to 'complete' and 'un-complete' tasks that updates the count out of 30. (eg/ if a person has 8 completed and i 'complete' another task for a person then the count updates to 9 and there are not 9 stars in boxes and 21 empty boxes) 

    * I can hardcode the family members names/mugshots/tasks/rewards.

    * Provide place holder images so that something renders and the demo site looks good.

    * the 'complete' count for each task should be persisted to disk so that the page/server can be reloaded and the count will not restart at 0.



## Updates

### Layout

* on medium size screens there should be two people per row

* the task/reward images should have an aspect ratio of no more than 3 : 2

### Non functional

* separate the config data that lists family members/tasks/rewards into its own file


### Multiple rewards / tasks

    * each person can have multiple rewards and tasks assigned to them where the number of stars that unlocks the reward as well as the number of stars provided by the task are specified in the config file

    * the UI updates such that the 'complete/undo' buttons are displayed right beneath the image of the task and the 'task' component goes in a carousel if the person has more than one task assigned to them

    * the 'reward' also becomes a carousel if there is more than one reward assigned to the person

    * the number of full/empty boxes are based on the number of stars it takes to attain a reward as well as the number of stars a person currently has; if they have more stars than the reward requires then all boxes would be filled with stars

### Reward Redemption

* there should be a 'redeem' and 'undo' button below the reward image such that when i hit 'redeem' it decreases my star inventory by the number of stars it takes to redeem the reward

* 'undo' would increase it by the reward amount and is only enabled if i already hit 'redeem'

* 'redeem' is only enabled if i have enough stars to redeem the reward

### Devices

    * there should be two different pages / interfaces

        1.  A dashboard; the scrollbar and buttons should be hidden in this interface

        2.  A mobile app that includes:
            *  all buttons to complete tasks and redeem rewards etc...

    * besides syncing the completion counts between the mobile/dashboard also sync the reward and task items that are currently displayed so if I change the reward/task shown for a certain person then it should be reflected on the dashboard


### Task Completion Units

* each task has different ways to get rewarded

    eg/
        tidy has:
            * 1 pile = 5 stars
            * 1 drawer = 5 stars
            * 5 shelves = 5 stars
            * 1 box = 10 stars

        language learning has:
            * 1 book review = 5 stars
            * 1 duolingo unit = 1 star

        phonics time:
            * 10 words = 1 star

        poo/pee in potty:
            * success = 1 star

* instead of having a single complete button for each task there should be one button for each completion unit where the button displays the unit label along with number of stars you get for completing it

* update `config.js` and `config.sample.js` accordingly

### Undo Button

* instead of having a single undo button on each card there should be one global undo button in the top right of the screen (in the app bar inline with 'Home Cred')

* tapping the undo button just reverts each action that was previously done in the current browser session in reverse order of when they were done (eg/ most recent is revert first)

### Disabled buttons

* any button that is disabled should have a clear style so that it is obvious it is disabled

### Information Organization

* the task title should go in the task card header

* the reward title should go in the reward card header

* the number of stars in a person's inventory along with their progress bar should go somewhere in the person card header

### Style

* the card buttons should be full width
