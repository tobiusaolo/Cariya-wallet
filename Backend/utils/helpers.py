from datetime import datetime

def calculate_expected_savings(num_children):
    """Calculate expected monthly savings (1000 UGX × number of children under 18)."""
    if not isinstance(num_children, int) or num_children < 0:
        raise ValueError("Number of children must be a non-negative integer")
    return 1000 * num_children

def update_activity_points(db, user_id, current_month):
    """Recalculate activity points based on monthly activities."""
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise ValueError(f"No user found with unique identifier {user_id}")
    
    max_months = min(current_month, 4)  # Limit to April 2025 (as of May 2, 2025)
    activity_points = 0
    for month in range(1, max_months + 1):
        month_key = f"{datetime.now().year}-{month:02d}"
        activity_doc = user_ref.collection('monthly_activities').document(month_key).get()
        if activity_doc.exists:
            activity_points += 1  # 1 point per month with an activity
    
    user_ref.update({'activity_points': activity_points})
    return activity_points

def update_compliance_score(db, user_id, current_month):
    """Update annual compliance score based on monthly data."""
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise ValueError(f"No user found with unique identifier {user_id}")
    
    user = user_doc.to_dict()
    annual_compliance = 0
    max_months = min(current_month, 4)  # Limit to April 2025

    for month in range(1, max_months + 1):
        month_key = f"{datetime.now().year}-{month:02d}"
        savings_doc = user_ref.collection('monthly_savings').document(month_key).get()
        activity_doc = user_ref.collection('monthly_activities').document(month_key).get()
        milestone_score = savings_doc.to_dict().get('milestone_score', 0) if savings_doc.exists else 0
        activity_point = 1 if activity_doc.exists else 0
        annual_compliance += milestone_score + activity_point
    
    user_ref.update({'compliance_score': annual_compliance})
    return annual_compliance

def calculate_donor_contribution(db, user_id, target_month):
    """Calculate donor contribution for a user in a specific month."""
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise ValueError(f"No user found with unique identifier {user_id}")

    month_key = f"{datetime.now().year}-{target_month:02d}"
    activity_doc = user_ref.collection('monthly_activities').document(month_key).get()
    savings_doc = user_ref.collection('monthly_savings').document(month_key).get()

    # Check if user has an activity for the month (activity score = 1)
    has_activity = activity_doc.exists
    if not has_activity:
        return 0.0  # No activity, no donor contribution

    # Check savings for the month
    if savings_doc.exists:
        user_savings = savings_doc.to_dict().get('savings', 0.0)
        if user_savings <= 0:
            return 0.0  # No savings, no donor contribution
        # Donor matches the savings
        donor_contribution = user_savings
    else:
        return 0.0  # No savings, no donor contribution

    # Update monthly_savings with donor contribution
    user_ref.collection('monthly_savings').document(month_key).update({
        'donor_contribution': donor_contribution
    })

    # Update user's total savings and donor contributions
    user = user_doc.to_dict()
    total_donor_contributions = user.get('donor_contributions', 0.0) + donor_contribution
    total_savings = user.get('savings', 0.0) + donor_contribution
    user_ref.update({
        'donor_contributions': total_donor_contributions,
        'savings': total_savings
    })

    return donor_contribution

def calculate_monthly_scores(db, target_month=None):
    """Calculate and update scores for all users at the end of the month, including donor contributions."""
    try:
        current_date = datetime.now()
        current_month = min(current_date.month, 4)  # Limit to April 2025
        target_month = target_month if target_month is not None else (current_month - 1) if current_month > 1 else 4
        if not 1 <= target_month <= 4:
            raise ValueError(f"Target month {target_month} is out of range for processing (Jan-Apr 2025)")

        month_key = f"{current_date.year}-{target_month:02d}"
        print(f"Calculating scores for month: {month_key}")

        users = db.collection('users').get()
        if not users:
            return {"message": "No users found to process"}

        for user_doc in users:
            user_id = user_doc.id
            user = user_doc.to_dict()
            user_ref = db.collection('users').document(user_id)

            # Calculate milestone score
            expected_savings = calculate_expected_savings(user['num_children'])
            savings_doc = user_ref.collection('monthly_savings').document(month_key).get()
            if savings_doc.exists:
                savings_data = savings_doc.to_dict()
                monthly_savings = savings_data.get('savings', 0)
                milestone_score = 1 if monthly_savings >= expected_savings else 0
            else:
                monthly_savings = 0
                milestone_score = 0

            # Update milestone score
            if savings_doc.exists:
                user_ref.collection('monthly_savings').document(month_key).update({
                    'milestone_score': milestone_score
                })

            # Calculate donor contribution
            donor_contribution = calculate_donor_contribution(db, user_id, target_month)

            # Update activity points
            activity_points = update_activity_points(db, user_id, current_month)

            # Update compliance score
            compliance_score = update_compliance_score(db, user_id, current_month)

            print(f"Updated scores for user {user_id}: Milestone={milestone_score}, Activity Points={activity_points}, Compliance={compliance_score}, Donor Contribution={donor_contribution}")

        return {"message": f"Scores and donor contributions calculated for month {month_key}"}

    except Exception as e:
        raise ValueError(f"Error calculating monthly scores: {str(e)}")
    

def segment_users_and_analyze_trends(db):
    """Segment users based on compliance scores and analyze behavior trends."""
    try:
        current_month = min(datetime.now().month, 4)
        max_possible_score = current_month * 2  # 2 points per month

        users = db.collection('users').get()
        if not users:
            return {"message": "No users found to segment"}

        # Segmentation
        high_compliance = []  # 18-24 points
        moderate_compliance = []  # 10-17 points
        low_compliance = []  # 0-9 points
        total_users = len(users)
        total_savings = 0
        total_activities = 0
        total_compliance_score = 0

        for user_doc in users:
            user = user_doc.to_dict()
            user_id = user_doc.id
            compliance_score = user.get('compliance_score', 0)
            total_compliance_score += compliance_score

            # Classify user
            user_info = {
                "user_id": user_id,
                "first_name": user['first_name'],
                "surname": user['surname'],
                "compliance_score": compliance_score,
                "total_savings": user.get('savings', 0.0),
                "activity_points": user.get('activity_points', 0)
            }

            # Adjust classification based on current max possible score
            if max_possible_score >= 18 and compliance_score >= 18:
                high_compliance.append(user_info)
            elif max_possible_score >= 10 and compliance_score >= 10:
                moderate_compliance.append(user_info)
            else:
                low_compliance.append(user_info)

            # Collect data for trends
            total_savings += user.get('savings', 0.0)
            total_activities += user.get('activity_points', 0)

        # Calculate trends and insights
        avg_compliance_score = total_compliance_score / total_users if total_users > 0 else 0
        avg_savings_per_user = total_savings / total_users if total_users > 0 else 0
        activity_participation_rate = (total_activities / (total_users * current_month)) * 100 if total_users > 0 else 0

        high_percentage = (len(high_compliance) / total_users) * 100 if total_users > 0 else 0
        moderate_percentage = (len(moderate_compliance) / total_users) * 100 if total_users > 0 else 0
        low_percentage = (len(low_compliance) / total_users) * 100 if total_users > 0 else 0

        # Insights
        insights = []
        if low_percentage > 50:
            insights.append(f"{low_percentage:.1f}% of users need intervention to increase engagement. Consider targeted outreach.")
        if activity_participation_rate < 50:
            insights.append(f"Only {activity_participation_rate:.1f}% of possible activities are being completed. Encourage more activity participation.")
        if avg_savings_per_user < 1000 * current_month:
            insights.append(f"Average savings ({avg_savings_per_user:.1f} UGX) is below expected ({1000 * current_month} UGX per user). Promote savings initiatives.")

        return {
            "segmentation": {
                "high_compliance": {
                    "users": high_compliance,
                    "count": len(high_compliance),
                    "percentage": high_percentage
                },
                "moderate_compliance": {
                    "users": moderate_compliance,
                    "count": len(moderate_compliance),
                    "percentage": moderate_percentage
                },
                "low_compliance": {
                    "users": low_compliance,
                    "count": len(low_compliance),
                    "percentage": low_percentage
                }
            },
            "trends": {
                "total_users": total_users,
                "average_compliance_score": avg_compliance_score,
                "average_savings_per_user": avg_savings_per_user,
                "activity_participation_rate": activity_participation_rate
            },
            "insights": insights
        }

    except Exception as e:
        raise ValueError(f"Error segmenting users: {str(e)}")